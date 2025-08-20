#!/bin/bash

# WebRTC VLM Multi-Object Detection - One-Command Start Script
# Usage: ./start.sh [mode] [environment] [--ngrok]
# Modes: wasm (default), server
# Environment: dev (default), prod

set -e

# Default values
MODE=${1:-wasm}
ENV=${2:-dev}
NGROK_FLAG=""

# Parse arguments for --ngrok flag
for arg in "$@"; do
    if [[ "$arg" == "--ngrok" ]]; then
        NGROK_FLAG="--ngrok"
        break
    fi
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 WebRTC VLM Multi-Object Detection Demo${NC}"
echo -e "${BLUE}============================================${NC}"

if [[ "$NGROK_FLAG" == "--ngrok" ]]; then
    echo -e "${YELLOW}📡 Ngrok tunnel will be created for public access${NC}"
fi

echo -e "${GREEN}Mode: ${MODE}${NC}"
echo -e "${GREEN}Environment: ${ENV}${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use $1; then
        echo -e "${YELLOW}⚠️  Port $1 is in use, stopping existing process...${NC}"
        kill -9 $(lsof -t -i:$1) 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local port=$1
    local protocol=${2:-http}
    echo -e "${BLUE}⏳ Waiting for server to start on port $port...${NC}"
    
    for i in {1..30}; do
        if curl -k -s "$protocol://localhost:$port" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Server is ready!${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
    return 1
}

# Function to get network IP
get_network_ip() {
    local ip=""
    
    # Method 1: route get (macOS)
    if command_exists route && [[ "$OSTYPE" == "darwin"* ]]; then
        local interface=$(route get default 2>/dev/null | grep interface | awk '{print $2}' | head -1)
        if [[ -n "$interface" ]]; then
            ip=$(ifconfig "$interface" 2>/dev/null | grep 'inet ' | awk '{print $2}' | head -1)
        fi
    fi
    
    # Method 2: ip route (Linux)
    if [[ -z "$ip" ]] && command_exists ip; then
        ip=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' | head -1)
    fi
    
    # Method 3: ifconfig fallback
    if [[ -z "$ip" ]]; then
        ip=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1)
    fi
    
    echo "$ip"
}

# Function to setup SSL certificates
setup_ssl() {
    if [[ ! -f "cert.pem" || ! -f "key.pem" ]]; then
        echo -e "${BLUE}🔒 Generating SSL certificates for HTTPS...${NC}"
        
        if command_exists openssl; then
            openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
                -subj "/C=US/ST=CA/L=Local/O=WebRTC Demo/CN=localhost" 2>/dev/null
            echo -e "${GREEN}✅ SSL certificates generated${NC}"
        else
            echo -e "${RED}❌ OpenSSL not found. Please install OpenSSL or provide cert.pem and key.pem${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ SSL certificates found${NC}"
    fi
}

# Function to install dependencies
install_dependencies() {
    if [[ ! -d "node_modules" ]]; then
        echo -e "${BLUE}� Installing Node.js dependencies...${NC}"
        
        if command_exists npm; then
            npm install
        else
            echo -e "${RED}❌ Node.js/npm not found. Please install Node.js 16+${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Dependencies already installed${NC}"
    fi
}

# Function to start ngrok tunnel
start_ngrok() {
    if command_exists ngrok; then
        echo -e "${BLUE}🌐 Starting ngrok tunnel...${NC}"
        ngrok http 3443 --log=stdout > ngrok.log 2>&1 &
        NGROK_PID=$!
        
        # Wait for ngrok to start and get URL
        sleep 3
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok\.io' | head -1)
        
        if [[ -n "$NGROK_URL" ]]; then
            echo -e "${GREEN}✅ Ngrok tunnel active: $NGROK_URL${NC}"
            echo -e "${YELLOW}📱 Share this URL with your phone: $NGROK_URL${NC}"
        else
            echo -e "${YELLOW}⚠️  Ngrok tunnel started but URL not detected. Check ngrok.log${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Ngrok not found. Install with: brew install ngrok (macOS) or snap install ngrok (Linux)${NC}"
        echo -e "${YELLOW}📱 Use network IP instead: https://$(get_network_ip):3443${NC}"
    fi
}

# Function to start WASM mode
start_wasm_mode() {
    echo -e "${BLUE}🧠 Starting WASM Mode (Low-Resource)${NC}"
    echo -e "${BLUE}====================================${NC}"
    
    if [[ "$ENV" == "prod" ]]; then
        echo -e "${BLUE}� Starting with Docker...${NC}"
        docker-compose up --build -d
        wait_for_server 3443 https
    else
        setup_ssl
        install_dependencies
        
        kill_port 3443
        
        echo -e "${BLUE}🚀 Starting Node.js server...${NC}"
        export MODE=wasm
        node server.js &
        SERVER_PID=$!
        
        wait_for_server 3443 https
    fi
    
    # Get network info
    NETWORK_IP=$(get_network_ip)
    
    echo ""
    echo -e "${GREEN}🎉 WASM Mode Ready!${NC}"
    echo -e "${GREEN}==================${NC}"
    echo -e "${GREEN}🖥️  Local:   https://localhost:3443${NC}"
    if [[ -n "$NETWORK_IP" ]]; then
        echo -e "${GREEN}� Network: https://$NETWORK_IP:3443${NC}"
    fi
    echo ""
    echo -e "${YELLOW}� Instructions:${NC}"
    echo -e "${YELLOW}1. Open https://localhost:3443 on your laptop${NC}"
    echo -e "${YELLOW}2. Accept the SSL certificate warning${NC}"
    echo -e "${YELLOW}3. Scan the QR code with your phone${NC}"
    echo -e "${YELLOW}4. Allow camera access on phone${NC}"
    echo -e "${YELLOW}5. Watch real-time AI detection!${NC}"
    echo ""
    
    # Start ngrok if requested
    if [[ "$NGROK_FLAG" == "--ngrok" ]]; then
        start_ngrok
    fi
    
    # For development mode, wait for user interrupt
    if [[ "$ENV" == "dev" ]]; then
        echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
        trap 'echo -e "\n${RED}� Stopping server...${NC}"; kill $SERVER_PID 2>/dev/null; [[ -n "$NGROK_PID" ]] && kill $NGROK_PID 2>/dev/null; exit' INT
        wait $SERVER_PID
    fi
}

# Function to start server mode
start_server_mode() {
    echo -e "${BLUE}🖥️  Starting Server Mode (High-Performance)${NC}"
    echo -e "${BLUE}===========================================${NC}"
    
    if [[ "$ENV" == "prod" ]]; then
        echo -e "${BLUE}� Starting with Docker...${NC}"
        export MODE=server
        docker-compose up --build -d
        wait_for_server 3443 https
    else
        setup_ssl
        install_dependencies
        
        kill_port 3443
        
        echo -e "${BLUE}🚀 Starting Node.js server...${NC}"
        export MODE=server
        node server.js &
        SERVER_PID=$!
        
        wait_for_server 3443 https
    fi
    
    # Get network info
    NETWORK_IP=$(get_network_ip)
    
    echo ""
    echo -e "${GREEN}🎉 Server Mode Ready!${NC}"
    echo -e "${GREEN}====================${NC}"
    echo -e "${GREEN}�️  Local:   https://localhost:3443${NC}"
    if [[ -n "$NETWORK_IP" ]]; then
        echo -e "${GREEN}📱 Network: https://$NETWORK_IP:3443${NC}"
    fi
    echo ""
    echo -e "${YELLOW}� Instructions:${NC}"
    echo -e "${YELLOW}1. Open https://localhost:3443 on your laptop${NC}"
    echo -e "${YELLOW}2. Accept the SSL certificate warning${NC}"
    echo -e "${YELLOW}3. Scan the QR code with your phone${NC}"
    echo -e "${YELLOW}4. Allow camera access on phone${NC}"
    echo -e "${YELLOW}5. Enjoy high-performance detection!${NC}"
    echo ""
    
    # Start ngrok if requested
    if [[ "$NGROK_FLAG" == "--ngrok" ]]; then
        start_ngrok
    fi
    
    # For development mode, wait for user interrupt
    if [[ "$ENV" == "dev" ]]; then
        echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
        trap 'echo -e "\n${RED}🛑 Stopping server...${NC}"; kill $SERVER_PID 2>/dev/null; [[ -n "$NGROK_PID" ]] && kill $NGROK_PID 2>/dev/null; exit' INT
        wait $SERVER_PID
    fi
}

# Function to show help
show_help() {
    echo "Usage: ./start.sh [mode] [environment] [--ngrok]"
    echo ""
    echo "Modes:"
    echo "  wasm    - Low-resource mode with client-side inference (default)"
    echo "  server  - High-performance mode with server-side capabilities"
    echo ""
    echo "Environment:"
    echo "  dev     - Development mode with Node.js (default)"
    echo "  prod    - Production mode with Docker"
    echo ""
    echo "Options:"
    echo "  --ngrok - Create public tunnel for remote phone access"
    echo ""
    echo "Examples:"
    echo "  ./start.sh                    # Start WASM mode in development"
    echo "  ./start.sh server prod        # Start server mode with Docker"
    echo "  ./start.sh wasm dev --ngrok   # Start WASM mode with ngrok tunnel"
    echo "  ./start.sh --help            # Show this help"
}

# Main execution
case "$1" in
    --help|-h|help)
        show_help
        exit 0
        ;;
    wasm)
        start_wasm_mode
        ;;
    server)
        start_server_mode
        ;;
    "")
        # Default to WASM mode
        start_wasm_mode
        ;;
    *)
        echo -e "${RED}❌ Unknown mode: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

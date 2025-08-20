# 🔧 Troubleshooting Guide

## Video Stream Issues

### Problem: "Video from mobile not visible on laptop"

**Symptoms:**
- Camera works on phone
- Phone shows "Connected to receiver"
- Laptop shows "Phone connected" but no video

**Solutions:**

1. **Check Browser Console (F12)**
   ```
   Look for errors like:
   - "Video track received" ✅ (Good)
   - "Video metadata loaded" ✅ (Good)
   - Connection state errors ❌ (Problem)
   ```

2. **WebRTC Connection Issues**
   - Both devices must be on **same WiFi network**
   - Try refreshing both pages
   - Check firewall settings (allow port 3443)

3. **HTTPS Certificate Issues**
   - Accept certificate warning on **both** devices
   - Try visiting https://192.168.1.18:3443 directly on phone first

4. **Video Autoplay Issues**
   - Click on the video area if it appears black
   - Some browsers block autoplay until user interaction

---

## Object Detection Issues

### Problem: "Objects not detected/Camera working but no detection"

**Symptoms:**
- Video stream works fine
- Click "Start WASM Inference" but no objects detected
- Bounding boxes don't appear

**Solutions:**

1. **Test Model Loading**
   - Visit: https://localhost:3443/test-model.html
   - Should show "Model working! Found X objects"
   - If fails, network/CDN issue with TensorFlow.js

2. **Check Console for Errors**
   ```
   Look for:
   - "Starting detection loop" ✅
   - "Running detection on frame" ✅
   - "Detected objects: X" ✅
   - Any error messages ❌
   ```

3. **Performance Issues**
   - Lower FPS (currently 5 FPS for better performance)
   - Ensure good lighting for camera
   - Point camera at recognizable objects

4. **Common Detection Objects**
   The COCO-SSD model can detect:
   - People, animals (cat, dog, bird, etc.)
   - Vehicles (car, bicycle, motorcycle)
   - Furniture (chair, sofa, table, bed)
   - Electronics (TV, laptop, phone, keyboard)
   - Food items, bottles, books, etc.

---

## Network/Connection Issues

### Problem: "Camera requires HTTPS" or "Permission denied"

**Solutions:**

1. **Generate Fresh Certificates**
   ```bash
   cd webrtc-vlm-demo
   rm cert.pem key.pem
   npm run start-https
   ```

2. **Check Network IP**
   ```bash
   npm run network-ip
   ```
   Use the displayed IP address

3. **Mobile Browser Compatibility**
   - ✅ Chrome Mobile (recommended)
   - ✅ Safari iOS
   - ❌ Firefox Mobile (limited WebRTC)

4. **Alternative: Use Sample Video**
   Add `?source=/sample.mp4` to sender URL for testing without camera

---

## Performance Optimization

### Tips for Better Detection

1. **Lighting**: Ensure good lighting conditions
2. **Objects**: Point at common objects (people, furniture, electronics)
3. **Distance**: Keep objects in clear view, not too close/far
4. **Stability**: Hold phone steady for better detection

### Performance Settings

Current optimized settings:
- Detection FPS: 5 (balance between speed and accuracy)
- Video constraints: 1280x720 max resolution
- Model: COCO-SSD (80 object classes)

---

## Debug Mode

### Enable Detailed Logging

Open browser console (F12) to see detailed logs:
- Connection events
- Video track information  
- Detection results
- Performance metrics

### Test URLs

- **Model Test**: https://localhost:3443/test-model.html
- **Main App**: https://localhost:3443
- **Direct Sender**: https://localhost:3443/sender.html?room=room1
- **Network IP Check**: `npm run network-ip`

---

## Still Having Issues?

1. **Restart Everything**
   ```bash
   # Stop server (Ctrl+C)
   npm run start-https
   # Refresh both browser pages
   ```

2. **Try Different Browsers**
   - Desktop: Chrome, Firefox, Safari, Edge
   - Mobile: Chrome Mobile, Safari iOS

3. **Check Network Setup**
   - Same WiFi network
   - No VPN interference
   - Firewall allows port 3443

4. **Use Sample Video for Testing**
   - Visit sender with: `?source=/sample.mp4`
   - This bypasses camera issues for testing detection only

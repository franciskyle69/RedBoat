# 🛡️ reCAPTCHA v2 Integration Guide

## Overview
This guide covers the complete integration of Google reCAPTCHA v2 into the WebProj application for enhanced security against bots and automated attacks.

## 🚀 Features Implemented

### **Frontend Components:**
- ✅ **ReCaptcha Component** - Reusable React component
- ✅ **useReCaptcha Hook** - Custom hook for state management
- ✅ **Login Page Integration** - reCAPTCHA on login form
- ✅ **Signup Page Integration** - reCAPTCHA on signup form
- ✅ **Configuration Management** - Environment-based settings

### **Backend Features:**
- ✅ **Server-side Verification** - Google API validation
- ✅ **Token Validation** - Secure token processing
- ✅ **Error Handling** - Graceful failure management
- ✅ **IP Address Tracking** - Enhanced security logging

## 📁 Files Created/Modified

### **New Files:**
- `frontend/src/components/ReCaptcha.tsx` - Main reCAPTCHA component
- `frontend/src/config/recaptcha.ts` - Configuration management
- `RECAPTCHA_INTEGRATION_GUIDE.md` - This documentation

### **Modified Files:**
- `frontend/index.html` - Added reCAPTCHA script
- `frontend/src/pages/LoginPage.tsx` - Integrated reCAPTCHA
- `frontend/src/pages/SignupPage.tsx` - Integrated reCAPTCHA
- `backend/server.ts` - Added server-side verification

## 🔧 Configuration

### **Environment Variables:**

#### **Frontend (.env):**
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
VITE_API_URL=http://localhost:5000
```

#### **Backend (.env):**
```env
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### **Development Setup:**
For development, the system uses Google's test keys:
- **Site Key:** `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key:** `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

## 🎯 Usage Examples

### **1. Basic reCAPTCHA Component:**
```tsx
import ReCaptcha, { useReCaptcha } from '../components/ReCaptcha';
import { getSiteKey } from '../config/recaptcha';

function MyForm() {
  const { token, isVerified, handleVerify, handleExpire, handleError, reset } = useReCaptcha();

  return (
    <form>
      {/* Your form fields */}
      
      <ReCaptcha
        siteKey={getSiteKey()}
        onVerify={handleVerify}
        onExpire={handleExpire}
        onError={handleError}
        theme="light"
        size="normal"
      />
      
      <button disabled={!isVerified}>
        Submit
      </button>
    </form>
  );
}
```

### **2. Advanced Configuration:**
```tsx
<ReCaptcha
  siteKey={getSiteKey()}
  onVerify={handleVerify}
  onExpire={handleExpire}
  onError={handleError}
  theme="dark"           // 'light' | 'dark'
  size="compact"         // 'compact' | 'normal' | 'invisible'
  tabindex={0}
  className="my-recaptcha"
  id="custom-recaptcha"
/>
```

### **3. Backend Verification:**
```typescript
// In your API endpoint
app.post("/api/endpoint", async (req, res) => {
  const { recaptchaToken } = req.body;
  
  if (recaptchaToken) {
    const isValid = await verifyRecaptcha(recaptchaToken, req.ip);
    if (!isValid) {
      return res.status(400).json({ message: "reCAPTCHA verification failed" });
    }
  }
  
  // Continue with your logic
});
```

## 🔒 Security Features

### **1. Server-side Verification:**
- Validates tokens with Google's API
- Checks IP address for additional security
- Prevents token reuse and manipulation

### **2. Client-side Protection:**
- Prevents form submission without verification
- Automatic token reset on errors
- Graceful error handling

### **3. Rate Limiting:**
- Built-in Google rate limiting
- IP-based tracking
- Prevents brute force attacks

## 🎨 Customization Options

### **Themes:**
```tsx
theme="light"  // Light theme (default)
theme="dark"   // Dark theme
```

### **Sizes:**
```tsx
size="normal"    // Standard size (default)
size="compact"   // Smaller size
size="invisible" // Invisible (for v3-like behavior)
```

### **Styling:**
```css
.recaptcha-container {
  margin: 10px 0;
  display: flex;
  justify-content: center;
}

/* Custom styling for reCAPTCHA widget */
.g-recaptcha {
  transform: scale(0.9);
  transform-origin: 0 0;
}
```

## 🚨 Error Handling

### **Common Issues & Solutions:**

#### **1. "reCAPTCHA verification failed"**
- **Cause:** Invalid or expired token
- **Solution:** Reset reCAPTCHA and try again

#### **2. "Please complete the reCAPTCHA verification"**
- **Cause:** Form submitted without verification
- **Solution:** Complete the reCAPTCHA challenge

#### **3. Script loading errors**
- **Cause:** Network issues or blocked scripts
- **Solution:** Check internet connection and firewall settings

### **Debug Mode:**
```typescript
// Enable debug logging
console.log('reCAPTCHA token:', token);
console.log('reCAPTCHA verified:', isVerified);
```

## 📊 Analytics & Monitoring

### **Success Metrics:**
- Verification success rate
- Error frequency
- User completion rate

### **Security Metrics:**
- Failed verification attempts
- Suspicious IP patterns
- Bot detection accuracy

## 🔄 Testing

### **Development Testing:**
```bash
# Use test keys for development
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

### **Production Testing:**
1. Get real keys from Google reCAPTCHA Console
2. Configure environment variables
3. Test with real users
4. Monitor verification success rates

## 🚀 Production Deployment

### **1. Get Production Keys:**
1. Visit [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Create a new site
3. Choose reCAPTCHA v2
4. Add your domain
5. Get Site Key and Secret Key

### **2. Environment Setup:**
```env
# Production environment
VITE_RECAPTCHA_SITE_KEY=your_production_site_key
RECAPTCHA_SECRET_KEY=your_production_secret_key
```

### **3. Domain Configuration:**
- Add all your domains to reCAPTCHA settings
- Include localhost for development
- Add staging and production domains

## 📈 Performance Considerations

### **Loading Optimization:**
- Script loads asynchronously
- No blocking of page rendering
- Lazy loading for better performance

### **Caching:**
- Tokens are cached client-side
- Server-side verification is optimized
- Minimal API calls

## 🛠️ Troubleshooting

### **Common Problems:**

#### **1. reCAPTCHA not loading:**
- Check script URL in HTML
- Verify network connectivity
- Check browser console for errors

#### **2. Verification always fails:**
- Verify secret key is correct
- Check server logs for API errors
- Ensure IP address is not blocked

#### **3. Styling issues:**
- Check CSS conflicts
- Verify container dimensions
- Test responsive design

## 📝 Best Practices

### **1. Security:**
- Always verify on server-side
- Never trust client-side validation
- Log verification attempts

### **2. UX:**
- Provide clear error messages
- Reset reCAPTCHA on errors
- Show loading states

### **3. Performance:**
- Load scripts asynchronously
- Minimize reCAPTCHA calls
- Cache tokens when possible

## 🎉 Success!

Your reCAPTCHA v2 integration is now complete! The system provides:

- ✅ **Bot Protection** - Prevents automated attacks
- ✅ **User Verification** - Ensures human interaction
- ✅ **Security Enhancement** - Protects login/signup forms
- ✅ **Seamless UX** - Smooth user experience
- ✅ **Production Ready** - Scalable and maintainable

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Test with Google's test keys
4. Verify environment configuration

**Happy coding!** 🚀

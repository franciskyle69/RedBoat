import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { validatePassword, PASSWORD_REQUIREMENTS } from '../utils/passwordValidation';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showRequirements?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  label,
  showRequirements = false,
  className = "",
  id,
  name,
  required = false
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const validation = validatePassword(value);

  const getStrengthColor = () => {
    switch (validation.strength) {
      case 'strong': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getStrengthWidth = () => {
    switch (validation.strength) {
      case 'strong': return 'w-full';
      case 'good': return 'w-3/4';
      case 'fair': return 'w-1/2';
      default: return 'w-1/4';
    }
  };

  const requirements = [
    { text: "At least 8 characters", met: value.length >= 8 },
    { text: "1 uppercase letter (A-Z)", met: /[A-Z]/.test(value) },
    { text: "1 lowercase letter (a-z)", met: /[a-z]/.test(value) },
    { text: "1 number (0-9)", met: /[0-9]/.test(value) },
    { text: "1 special character (!@#$%^&*)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) }
  ];

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Strength indicator */}
      {showRequirements && value.length > 0 && (
        <div className="mt-2">
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${getStrengthColor()} ${getStrengthWidth()} transition-all duration-300`} />
          </div>
          <p className="text-xs text-gray-500 mt-1 capitalize">
            Password strength: {validation.strength}
          </p>
        </div>
      )}

      {/* Requirements checklist */}
      {showRequirements && (isFocused || value.length > 0) && (
        <ul className="mt-2 space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center gap-2 text-xs">
              {req.met ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <X size={14} className="text-gray-400" />
              )}
              <span className={req.met ? "text-green-600" : "text-gray-500"}>
                {req.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PasswordInput;

export function getMobileMaxLength(countryCode: string): number {
  return countryCode === "+91" ? 10 : 9;
}

export function validateMobile(countryCode: string, mobile: string): string | null {
  const digits = mobile.replace(/\D/g, "");

  if (!digits) {
    return "Mobile number is required";
  }

  switch (countryCode) {
    case "+91":
      if (digits.length !== 10) {
        return "Indian mobile number must be exactly 10 digits";
      }
      if (!/^[6-9]/.test(digits)) {
        return "Indian mobile number must start with 6, 7, 8, or 9";
      }
      return null;
    case "+971":
      if (digits.length !== 9) {
        return "UAE mobile number must be exactly 9 digits";
      }
      return null;
    case "+966":
      if (digits.length !== 9) {
        return "Saudi mobile number must be exactly 9 digits";
      }
      if (!/^5/.test(digits)) {
        return "Saudi mobile number must start with 5";
      }
      return null;
    default:
      if (digits.length < 8 || digits.length > 15) {
        return "Enter a valid mobile number";
      }
      return null;
  }
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  if (password.length > 64) {
    return "Password must be 64 characters or fewer";
  }
  if (/\s/.test(password)) {
    return "Password cannot contain spaces";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address";
  }
  return null;
}

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [localPart, domain] = email.split('@');

  if (localPart.length < 3) {
    return email;
  }

  const maskedLocalPart = localPart.slice(0, 2) + '*'.repeat(localPart.length - 3) + localPart.slice(-1);

  return `${maskedLocalPart}@${domain}`;
};

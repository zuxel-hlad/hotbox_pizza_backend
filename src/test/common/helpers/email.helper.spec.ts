import { maskEmail } from '@common/helpers/email.helper';

describe('maskEmail', () => {
  it('masks the middle of the local part', () => {
    expect(maskEmail('john.doe@x.com')).toBe('jo*****e@x.com');
  });

  it('keeps a three-character local part unchanged', () => {
    expect(maskEmail('abc@x.com')).toBe('abc@x.com');
  });

  it.each(['', 'not-an-email', 'ab@x.com'])('returns %p as is', (email) => {
    expect(maskEmail(email)).toBe(email);
  });
});

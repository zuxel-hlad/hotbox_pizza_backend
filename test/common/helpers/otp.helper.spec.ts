import { generateOTP } from '@common/helpers/otp.helper';

describe('generateOTP', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a six-digit string', () => {
    expect(generateOTP()).toMatch(/^\d{6}$/);
  });

  it.each([
    [0, '100000'],
    [0.999999, '999999'],
  ])('maps Math.random() = %p to %p', (random, otp) => {
    jest.spyOn(Math, 'random').mockReturnValue(random);

    expect(generateOTP()).toBe(otp);
  });
});

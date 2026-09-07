import { capturePictureOptions, selectCameraPictureSize } from '@/services/cameraService';

describe('camera picture size', () => {
  it('captures JPEG evidence accepted by the sync API', () => {
    expect(capturePictureOptions).toEqual({ imageType: 'jpg', quality: 0.76 });
  });

  it('selects the supported size closest to 1920 pixels', () => {
    expect(selectCameraPictureSize(['4032x3024', '2560x1440', '1920x1080', '1280x720']))
      .toBe('1920x1080');
  });

  it('ignores malformed camera sizes', () => {
    expect(selectCameraPictureSize(['4:3', 'not-a-size', '1600x1200'])).toBe('1600x1200');
  });
});

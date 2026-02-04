import { OpenFeature } from '@openfeature/web-sdk';
import { FlagdWebProvider } from '@openfeature/flagd-web-provider';

export async function initOpenFeature() {
  const provider = new FlagdWebProvider({
    host: 'localhost',
    port: 8013,
    tls: false,
    // cache: true, // optional
  });

  await OpenFeature.setProviderAndWait(provider);
  return OpenFeature.getClient('frontend');
}
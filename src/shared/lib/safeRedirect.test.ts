import { describe, expect, it } from 'vitest';
import { buildLoginPath, getSafeRedirectPath } from './safeRedirect';

describe('getSafeRedirectPath', () => {
  it.each(['/profil', '/ilanlar?kasa=suv', '/'])('internalPath_%s_isKept', (path) => {
    expect(getSafeRedirectPath(path)).toBe(path);
  });

  it.each([
    null,
    '',
    'profil',
    'https://evil.example.com',
    '//evil.example.com',
    '/\\evil.example.com',
    '/\t/evil.example.com',
    'javascript:alert(1)',
  ])('unsafeValue_%s_fallsBackToHome', (value) => {
    expect(getSafeRedirectPath(value)).toBe('/');
  });
});

describe('buildLoginPath', () => {
  it('currentPathWithQuery_isEncodedIntoNext', () => {
    expect(buildLoginPath('/ilanlar?kasa=suv')).toBe('/giris?next=%2Filanlar%3Fkasa%3Dsuv');
  });
});

export let activeGsCredentialFile: string | null = null;
export let activeLcCredentialFile: string | null = null;

export function setActiveGsCredential(filePath: string): void {
  activeGsCredentialFile = filePath;
}

export function setActiveLcCredential(filePath: string): void {
  activeLcCredentialFile = filePath;
}

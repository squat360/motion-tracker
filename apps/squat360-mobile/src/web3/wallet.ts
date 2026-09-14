/**
 * On-device demo locker. ethers.Wallet, stored in app documents.
 * Not a hardware wallet. Super Coach works with no locker at all.
 */
import { Wallet } from 'ethers';
import * as FileSystem from 'expo-file-system';

const FILE = 'squat360-web3-wallet.json';

export type StoredWallet = {
  address: string;
  privateKey: string;
};

function fileUri(): string | null {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}${FILE}` : null;
}

export async function loadStoredWallet(): Promise<StoredWallet | null> {
  const uri = fileUri();
  if (!uri) return null;
  try {
    const raw = await FileSystem.readAsStringAsync(uri);
    const parsed = JSON.parse(raw) as StoredWallet;
    if (!parsed?.address || !parsed?.privateKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createWallet(): Promise<StoredWallet> {
  const wallet = Wallet.createRandom();
  const stored: StoredWallet = { address: wallet.address, privateKey: wallet.privateKey };
  const uri = fileUri();
  if (uri) {
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(stored));
  }
  return stored;
}

export async function loadOrCreateWallet(): Promise<StoredWallet> {
  return (await loadStoredWallet()) ?? createWallet();
}

export async function resetWallet(): Promise<StoredWallet> {
  const uri = fileUri();
  if (uri) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // ignore
    }
  }
  return createWallet();
}

export function walletFromStored(stored: StoredWallet): Wallet {
  return new Wallet(stored.privateKey);
}

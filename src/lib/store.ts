import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Transaction {
  id: string;
  type: 'deposit' | 'watch' | 'credit_used' | 'referral_credit';
  amount: number;
  titleId?: string;
  titleName?: string;
  timestamp: number;
}

interface UserState {
  isLoggedIn: boolean;
  username: string;
  phone: string;
  wallet: number;
  freeCredits: number;
  referralCode: string;
  referralCount: number;
  myList: string[];
  watchHistory: string[];
  transactions: Transaction[];
  login: (username: string, phone: string) => void;
  logout: () => void;
  deposit: (amount: number) => void;
  watchTitle: (titleId: string, titleName: string) => 'free' | 'paid' | 'insufficient';
  addToList: (id: string) => void;
  removeFromList: (id: string) => void;
  addReferral: () => void;
}

const generateCode = () => 'CL' + Math.random().toString(36).substring(2, 8).toUpperCase();

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      username: '',
      phone: '',
      wallet: 0,
      freeCredits: 0,
      referralCode: '',
      referralCount: 0,
      myList: [],
      watchHistory: [],
      transactions: [],

      login: (username, phone) => set({
        isLoggedIn: true,
        username,
        phone,
        freeCredits: 1,
        referralCode: generateCode(),
        transactions: [{
          id: Date.now().toString(),
          type: 'referral_credit',
          amount: 0,
          timestamp: Date.now(),
        }],
      }),

      logout: () => set({
        isLoggedIn: false,
        username: '',
        phone: '',
        wallet: 0,
        freeCredits: 0,
        referralCode: '',
        referralCount: 0,
        myList: [],
        watchHistory: [],
        transactions: [],
      }),

      deposit: (amount) => set(s => ({
        wallet: s.wallet + amount,
        transactions: [...s.transactions, {
          id: Date.now().toString(),
          type: 'deposit',
          amount,
          timestamp: Date.now(),
        }],
      })),

      watchTitle: (titleId, titleName) => {
        const s = get();
        if (s.freeCredits > 0) {
          set({
            freeCredits: s.freeCredits - 1,
            watchHistory: [...s.watchHistory, titleId],
            transactions: [...s.transactions, {
              id: Date.now().toString(),
              type: 'credit_used',
              amount: 0,
              titleId,
              titleName,
              timestamp: Date.now(),
            }],
          });
          return 'free';
        }
        if (s.wallet >= 400) {
          set({
            wallet: s.wallet - 400,
            watchHistory: [...s.watchHistory, titleId],
            transactions: [...s.transactions, {
              id: Date.now().toString(),
              type: 'watch',
              amount: 400,
              titleId,
              titleName,
              timestamp: Date.now(),
            }],
          });
          return 'paid';
        }
        return 'insufficient';
      },

      addToList: (id) => set(s => ({
        myList: s.myList.includes(id) ? s.myList : [...s.myList, id],
      })),

      removeFromList: (id) => set(s => ({
        myList: s.myList.filter(x => x !== id),
      })),

      addReferral: () => set(s => {
        const newCount = s.referralCount + 1;
        const earnedCredit = newCount % 2 === 0;
        return {
          referralCount: newCount,
          freeCredits: earnedCredit ? s.freeCredits + 1 : s.freeCredits,
          transactions: earnedCredit ? [...s.transactions, {
            id: Date.now().toString(),
            type: 'referral_credit' as const,
            amount: 0,
            timestamp: Date.now(),
          }] : s.transactions,
        };
      }),
    }),
    { name: 'cinematic-lens-store' }
  )
);

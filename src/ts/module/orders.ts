import * as auth from "./auth";
import storage from "./storage";

export type CartItem = { id: string; qty: number };

export type Order = {
  id: string;
  username?: string;
  items: CartItem[];
  total: number;
  date: string; // ISO
  status?: string;
};

function getKeyForUser(username?: string) {
  if (username) return `orders:${username}`;
  return "orders:guest";
}

export function getOrders(username?: string): Order[] {
  if (username) {
    const raw = localStorage.getItem(getKeyForUser(username));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  }

  const raw = sessionStorage.getItem(getKeyForUser(undefined));
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Order[]) : [];
}

export function setOrders(orders: Order[], username?: string) {
  username
    ? localStorage.setItem(getKeyForUser(username), JSON.stringify(orders))
    : sessionStorage.setItem(getKeyForUser(undefined), JSON.stringify(orders));
}

export function addOrder(order: Order) {
  const username = order.username;
  const existing = getOrders(username);
  existing.unshift(order);
  setOrders(existing, username);
}

export function generateOrderId(): string {
  // yyyyMMdd + random 4 digits
  const d = new Date();
  const yyyy = d.getFullYear().toString();
  const MM = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `OID${yyyy}${MM}${dd}${rand}`;
}

export function getPreferredOrders(): Order[] {
  const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || undefined;
  if (username) return getOrders(username);
  return getOrders(undefined);
}

export default {
  getOrders,
  setOrders,
  addOrder,
  generateOrderId,
  getPreferredOrders,
};

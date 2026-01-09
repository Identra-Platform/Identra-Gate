import { goto } from "$app/navigation";
import { getAuthToken } from "$lib/utils/api";
import { redirect, type Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === '/health') {
    return resolve(event);
  }

  if (event.url.pathname === '/login') {
    return resolve(event);
  }

  if (event.cookies.get('access_token')) return resolve(event);

  throw redirect(303, '/login');
}
import { supabase, isDemoMode } from '../lib/supabase';

export interface BookingInput {
  name: string;
  email: string;
  whatsapp: string;
  booking_date: string;
  booking_time: string;
  meet_link: string;
}

export async function getBookedSlots(date: string): Promise<string[]> {
  if (isDemoMode || !supabase) return [];
  const { data } = await supabase
    .from('club_bookings')
    .select('booking_time')
    .eq('booking_date', date)
    .eq('status', 'confirmed');
  return (data ?? []).map((r: { booking_time: string }) => r.booking_time);
}

export async function saveBooking(input: BookingInput): Promise<void> {
  if (isDemoMode || !supabase) {
    await new Promise(r => setTimeout(r, 1200));
    return;
  }
  const { error } = await supabase.from('club_bookings').insert(input);
  if (error) throw new Error(error.message);
}

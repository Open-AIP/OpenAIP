'use server'

import { createClient } from "../supabase/server";

export const getUser = async () => {

  const supabase = await createClient();

  const { data, error } = await supabase.from('auth').select();

  if(error || !data) {
    throw new Error(
      error?.message ||
      'Failed to fetch users.'
    )
  }

  return data[0];
}
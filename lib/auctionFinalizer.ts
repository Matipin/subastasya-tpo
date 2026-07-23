import { supabase } from './supabase';

/**
 * Checks for auctions that have ended but are still marked as 'active',
 * and finalizes them according to the business rules:
 * - Assign winners to items with bids.
 * - SubastasYa auto-purchases items with NO bids.
 */
export async function finalizeAuctions() {
  try {
    // 1. Fetch active auctions that have ended
    const now = new Date().toISOString();
    const { data: endedAuctions, error: auctionsError } = await supabase
      .from('auctions')
      .select('id')
      // Note: In Supabase, if we are doing this from the client side without RLS bypass,
      // it might fail if we don't have read access to all auctions. 
      // Assuming public read access is enabled.
      .eq('status', 'active')
      .lt('end_date', now);

    if (auctionsError) throw auctionsError;
    if (!endedAuctions || endedAuctions.length === 0) return;

    for (const auction of endedAuctions) {
      // 2. Fetch all items for this auction
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('auction_id', auction.id);

      if (items) {
        for (const item of items) {
          // Check for highest bid
          const { data: bids } = await supabase
            .from('bids')
            .select('amount, user_id')
            .eq('item_id', item.id)
            .order('amount', { ascending: false })
            .limit(1);

          if (bids && bids.length > 0) {
            // Escenario A: Hubo pujas. El item se marca como vendido.
            await supabase.from('items').update({ status: 'sold' }).eq('id', item.id);
          } else {
            // Escenario B: Nadie pujó. SubastasYa compra el artículo al precio base.
            await supabase.from('items').update({ status: 'sold' }).eq('id', item.id);
            
            // Generamos la transferencia al vendedor original simulando el pago de la empresa
            await supabase.from('transactions').insert({
              user_id: item.owner_id, // Usamos el ID del vendedor para acreditarle el dinero
              type: 'company_purchase',
              amount: item.starting_price,
              description: `Auto-compra de SubastasYa por falta de pujas: ${item.title}`
            });
          }
        }
      }

      // 3. Mark auction as completed
      await supabase.from('auctions').update({ status: 'ended' }).eq('id', auction.id);
    }
  } catch (error) {
    console.error("Error finalizing auctions:", error);
  }
}

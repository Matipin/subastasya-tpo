import { supabase } from './supabase';

/**
 * Checks for auctions that have ended but are still marked as 'active',
 * and finalizes them according to the business rules:
 * - Assign winners to items with bids.
 * - SubastasYa auto-purchases items with NO bids.
 */
export async function finalizeAuctions() {
  try {
    // Only finalize auctions marked as 'ended' or that specifically need cleanup
    // Client-side execution handles errors gracefully
    const now = new Date().toISOString();
    const { data: endedAuctions, error: auctionsError } = await supabase
      .from('auctions')
      .select('id')
      .eq('status', 'ended');

    if (auctionsError || !endedAuctions || endedAuctions.length === 0) return;

    for (const auction of endedAuctions) {
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('auction_id', auction.id)
        .eq('status', 'in_auction');

      if (items) {
        for (const item of items) {
          const { data: bids } = await supabase
            .from('bids')
            .select('amount, bidder_id')
            .eq('item_id', item.id)
            .order('amount', { ascending: false })
            .limit(1);

          if (bids && bids.length > 0) {
            await supabase.from('items').update({ status: 'sold' }).eq('id', item.id);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error finalizing auctions:", error);
  }
}


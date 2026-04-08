# Payouts Module (Push-Only)

This module helps agents execute small batch payouts using the SuperDappAirdrop contract.

What it does
- Build a canonical payout manifest from raw winners
- Export the manifest to CSV or JSON
- Prepare transactions for ERC-20 or native transfers (chunking supported)
- Execute a prepared tx plan using a viem WalletClient/PublicClient
- Reconcile results by scanning receipts/logs

Key APIs (re-exported from `@superdapp/agents`)
- buildManifest(winners, { token, roundId, groupId })
- toCSV(manifest), toJSON(manifest)
- preparePushTxs(manifest, { token, airdrop, maxPerBatch?, singleApproval? })
- executeTxPlan(prepared, { wallet, publicClient, stopOnFail? })
- reconcilePush(publicClient, tokenAddress, manifest, txHashes)

Constraints
- Push-only (no Merkle)
- Signer must be the Airdrop owner()
- Reasonable batch sizes (e.g., 50–100 addresses per batch)

See tests under `src/__tests__/payouts*` for usage patterns.
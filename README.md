# 💎 DiamondTrace: Blockchain-based Ethical Diamond Tracking

Welcome to DiamondTrace, a decentralized platform built on the Stacks blockchain using Clarity smart contracts! This project addresses the real-world problem of "blood diamonds" by providing a transparent, immutable ledger for tracking the supply chain of diamonds from mine to market. Buyers can verify that their diamonds are conflict-free, ethically sourced, and compliant with international standards like the Kimberley Process, reducing fraud and supporting sustainable mining practices.

## ✨ Features

🔍 Full supply chain traceability from extraction to sale  
✅ Conflict-free certification at every stage  
📜 Immutable audit logs for all transactions  
👥 Role-based access for miners, certifiers, cutters, retailers, and buyers  
🔄 Secure ownership transfers with provenance history  
🚫 Anti-fraud mechanisms to prevent duplicate or falsified entries  
📈 Queryable database for instant verification  
💰 Integration for tokenized ownership (NFT-like representation of diamonds)  
🛡️ Dispute resolution for supply chain claims  
🌍 Support for global compliance reporting

## 🛠 How It Works

DiamondTrace uses a series of interconnected Clarity smart contracts to manage the diamond lifecycle. Each diamond is registered with a unique identifier (e.g., a hash of its physical characteristics like carat, cut, and laser inscription). As it moves through the supply chain, certified entities update its status, ensuring every step is verifiable on the blockchain.

**For Miners/Extractors**  
- Register a new diamond with its origin details (location, date, ethical certifications).  
- Call the `register-diamond` function in the DiamondRegistry contract with the diamond's hash, geolocation, and initial certification proof.  
- This creates an immutable entry proving ethical extraction.

**For Certifiers/Auditors**  
- Verify and certify diamonds at key stages (e.g., rough export, cutting, polishing).  
- Use the `add-certification` function in the Certification contract to append signed proofs.  
- Certifications include digital signatures from authorized bodies to confirm conflict-free status.

**For Cutters/Retailers**  
- Transfer ownership securely via the OwnershipTransfer contract's `transfer-ownership` function.  
- Update supply chain events (e.g., cutting details) in the SupplyChainTracker contract.  
- Each transfer logs the new owner and maintains the full history.

**For Buyers/Verifiers**  
- Query a diamond's full history using `get-diamond-provenance` in the Verification contract.  
- Call `verify-conflict-free` to check compliance across the chain.  
- If tokenized, buyers can claim ownership via the DiamondNFT contract for resale or insurance purposes.

**For Dispute Resolution**  
- If a claim is challenged (e.g., suspected fraud), use the DisputeResolution contract to log evidence and vote on resolutions by certified stakeholders.

This ensures end-to-end transparency, helping consumers make ethical purchases while empowering regulators to audit global diamond trade.

## 📚 Smart Contracts

DiamondTrace is powered by 8 interconnected Clarity smart contracts, each handling a specific aspect of the system for modularity and security. Here's an overview:

1. **AuthorityRegistry.clar**  
   Manages registration and verification of authorized entities (e.g., miners, certifiers, auditors). Functions include `register-authority` and `verify-authority` to ensure only trusted parties can interact with the system.

2. **DiamondRegistry.clar**  
   Handles initial diamond registration. Key functions: `register-diamond` (stores hash, origin, and metadata) and `check-uniqueness` to prevent duplicates.

3. **Certification.clar**  
   Manages adding and verifying certifications at supply chain stages. Includes `add-certification` (appends proofs) and `get-certifications` for history retrieval.

4. **OwnershipTransfer.clar**  
   Facilitates secure transfers of diamond ownership. Functions like `transfer-ownership` log changes and update the provenance chain.

5. **SupplyChainTracker.clar**  
   Tracks events in the diamond's lifecycle (e.g., export, cutting, import). Uses `log-event` to create an immutable sequence of updates.

6. **AuditLog.clar**  
   Provides a tamper-proof log of all actions across contracts. Functions include `append-log` (automatic on key events) and `query-logs` for auditing.

7. **Verification.clar**  
   Offers query functions for end-users. Includes `get-diamond-provenance` (full history) and `verify-conflict-free` (checks all certifications).

8. **DiamondNFT.clar**  
   Tokenizes diamonds as non-fungible tokens (NFTs) for digital ownership. Functions: `mint-nft` (links to physical diamond) and `transfer-nft` for resale.

These contracts interact via cross-contract calls in Clarity, ensuring atomicity and security on the Stacks blockchain. For example, a transfer in OwnershipTransfer automatically logs to AuditLog and updates SupplyChainTracker.
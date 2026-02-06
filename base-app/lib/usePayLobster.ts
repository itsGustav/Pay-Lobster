import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS, REPUTATION_ABI, CREDIT_ABI, USDC_ABI, ESCROW_ABI } from "./contracts";

export function usePayLobster() {
  const { address } = useAccount();

  // Read user's reputation data
  const { data: reputation, refetch: refetchReputation } = useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: REPUTATION_ABI,
    functionName: "getReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read user's credit score
  const { data: creditScore, refetch: refetchCredit } = useReadContract({
    address: CONTRACTS.CREDIT,
    abi: CREDIT_ABI,
    functionName: "getCreditScore",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Send USDC
  const sendUSDC = async (to: string, amount: string) => {
    if (!to || !amount) throw new Error("Missing recipient or amount");
    
    writeContract({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: "transfer",
      args: [to as `0x${string}`, parseUnits(amount, 6)],
    });
  };

  // Approve USDC for escrow
  const approveUSDC = async (amount: string) => {
    if (!amount) throw new Error("Missing amount");
    
    writeContract({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: "approve",
      args: [CONTRACTS.ESCROW, parseUnits(amount, 6)],
    });
  };

  // Create escrow
  const createEscrow = async (recipient: string, amount: string, description: string) => {
    if (!recipient || !amount || !description) {
      throw new Error("Missing escrow details");
    }
    
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: ESCROW_ABI,
      functionName: "createEscrow",
      args: [
        recipient as `0x${string}`,
        parseUnits(amount, 6),
        CONTRACTS.USDC,
        description,
      ],
    });
  };

  // Release escrow
  const releaseEscrow = async (escrowId: number) => {
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: ESCROW_ABI,
      functionName: "releaseEscrow",
      args: [BigInt(escrowId)],
    });
  };

  // Format data for display
  const lobsterScore = reputation ? Number(reputation[0]) : 0;
  const trustVector = reputation ? Number(reputation[1]) : 0;
  const credit = creditScore ? Number(creditScore) : 0;
  const balance = usdcBalance ? formatUnits(usdcBalance, 6) : "0";

  return {
    // User data
    address,
    lobsterScore,
    trustVector,
    credit,
    balance,
    
    // Actions
    sendUSDC,
    approveUSDC,
    createEscrow,
    releaseEscrow,
    
    // Transaction state
    hash,
    isPending,
    isConfirming,
    error,
    
    // Refresh functions
    refetchReputation,
    refetchCredit,
    refetchBalance,
  };
}

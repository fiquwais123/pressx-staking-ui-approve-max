import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseUnits, formatUnits } from "ethers";

const stakingAddress = "0xFA32A6ffaE565FfD3486382C059f97bb9536d4a3";
const gsxTokenAddress = "0x72653ca02bb94B3ac724D0638911402f5c31c63E";

const gsxAbi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

const stakingAbi = [
  "function stake(uint256 _amount) external",
  "function claim() external",
  "function unstake() external",
  "function getStake(address _user) external view returns (uint256 amount, uint256 since)",
  "function totalStaked() external view returns (uint256)"
];

let fetchData;

export default function App() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [address, setAddress] = useState();
  const [balance, setBalance] = useState("0");
  const [stakeAmount, setStakeAmount] = useState("100000");
  const [userStake, setUserStake] = useState("0");
  const [totalStaked, setTotalStaked] = useState("0");
  const [availableReward, setAvailableReward] = useState("0");

  fetchData = async () => {
    const token = new Contract(gsxTokenAddress, gsxAbi, provider);
    const staking = new Contract(stakingAddress, stakingAbi, provider);
    const bal = await token.balanceOf(address);
    const user = await staking.getStake(address);
    const total = await staking.totalStaked();
    setBalance(formatUnits(bal, 18));
    setUserStake(formatUnits(user[0], 18));
    setTotalStaked(formatUnits(total, 18));
      const stakedAmt = formatUnits(user[0], 18);
      const stakeTime = Number(user[1]);
      if (stakedAmt > 0 && stakeTime > 0) {
        const now = Math.floor(Date.now() / 1000);
        const duration = now - stakeTime;
        const reward = (Number(stakedAmt) * 0.6 * duration) / (365 * 24 * 60 * 60);
        setAvailableReward(reward.toFixed(4));
      } else {
        setAvailableReward("0");
      }
  };

  useEffect(() => {
    if (!provider || !address) return;
    fetchData();
  }, [provider, address]);

  const connectWallet = async () => {
    if (window.ethereum) {
      const prov = new BrowserProvider(window.ethereum);
      const signer = await prov.getSigner();
      const addr = await signer.getAddress();
      setProvider(prov);
      setSigner(signer);
      setAddress(addr);
    }
  };

  const approve = async () => {
    const token = new Contract(gsxTokenAddress, gsxAbi, signer);
    await token.approve(stakingAddress, MaxUint256);
  };

  const stake = async () => {
    const staking = new Contract(stakingAddress, stakingAbi, signer);
    const tx = await staking.stake(parseUnits(stakeAmount, 18));
    await tx.wait();
    await fetchData();
  };

  const claim = async () => {
    const staking = new Contract(stakingAddress, stakingAbi, signer);
    const tx = await staking.claim();
    await tx.wait();
    await fetchData();
  };

  const unstake = async () => {
    const staking = new Contract(stakingAddress, stakingAbi, signer);
    const tx = await staking.unstake();
    await tx.wait();
    await fetchData();
  };

  return (
    <div style={{ background: "linear-gradient(to bottom, #FFCC00, #FFB300)", minHeight: "100vh", padding: "40px", fontFamily: "Arial", color: "#000", textAlign: "center" }}>
      <img src="pressx-logo.png" alt="Press X Logo" style={{ width: "150px", marginBottom: "20px" }} />
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Staking Platform</h1>
      <p style={{ fontSize: "16px", marginBottom: "10px" }}>Minimum Staking Amount: 100,000 GSX</p>
      <div style={{ height: "8px", backgroundColor: "#eee", margin: "10px auto", width: "80%", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{
          width: `${(Number(totalStaked) / 20000000) * 100}%`,
          background: "linear-gradient(to right, #00ff00, #ffffff)",
          height: "100%",
          transition: "width 0.5s",
        }} />
      </div>
      <p style={{ color: "green", fontWeight: "bold" }}>Total Staked: {Number(totalStaked).toLocaleString()} / 20,000,000 GSX</p>
      <div style={{ backgroundColor: "#FFF3CD", display: "inline-block", padding: "8px 20px", borderRadius: "10px", margin: "15px 0" }}>
        <strong>APR: 60%</strong>
      </div>
      <p>Your Balance: {Number(balance).toLocaleString()} GSX</p>
      <p>Staked Amount: {Number(userStake).toLocaleString()} GSX</p>
      <input
        type="number"
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
        placeholder="Min. stake: 100,000 GSX"
        style={{ padding: "10px", width: "250px", borderRadius: "6px", marginTop: "10px" }}
      />
      <div style={{ marginTop: "20px" }}>
        <button onClick={stake} style={{ backgroundColor: "#4CAF50", color: "white", padding: "10px 20px", borderRadius: "6px", marginRight: "10px", border: "none" }}>Stake</button>
        <button onClick={unstake} style={{ backgroundColor: "#f44336", color: "white", padding: "10px 20px", borderRadius: "6px", border: "none" }}>Unstake</button>
      </div>
      <p style={{ marginTop: "20px" }}>Available Rewards: {Number(availableReward).toLocaleString()} GSX</p>
      <button onClick={claim} style={{ backgroundColor: "#9C27B0", color: "white", padding: "12px 30px", borderRadius: "8px", marginTop: "10px", border: "none" }}>Claim Rewards</button>
      {!address && (
        <div style={{ position: "absolute", top: "20px", right: "20px" }}>
          <button onClick={connectWallet} style={{ backgroundColor: "#2196F3", color: "#fff", padding: "8px 12px", border: "none", borderRadius: "4px" }}>Connect Wallet</button>
        </div>
      )}
    </div>
  );
}

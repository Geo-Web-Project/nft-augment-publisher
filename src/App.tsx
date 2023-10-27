import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, optimism, optimismGoerli } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import Layout from "./components/Layout";
import Publisher from "./components/Publisher";
import "@rainbow-me/rainbowkit/styles.css";
import "./App.scss";

const { chains, publicClient } = configureChains(
  [mainnet, optimism, optimismGoerli],
  [
    alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_ID }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "NFT Augment Publisher",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

function App() {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains} modalSize="compact">
          <Layout>
            <Publisher />
          </Layout>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}

export default App;

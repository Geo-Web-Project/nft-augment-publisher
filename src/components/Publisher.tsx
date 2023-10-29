import { useState } from "react";
import { Address, useAccount } from "wagmi";
import { optimismGoerli } from "wagmi/chains";
import { readContract, getWalletClient, waitForTransaction } from "@wagmi/core";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import CopyTooltip from "./CopyTooltip";
import CopyIcon from "../assets/copy.svg";
import ERC721ABI from "../abi/ERC721.json";
import NFTAugmentTemplateABI from "../abi/NFTAugmentTemplate.json";
import { augmentTemplateBytecode } from "../lib/constants";

enum Chain {
  MAINNET = 1,
  OPTIMISM = 10,
  POLYGON = 137,
}

enum MediaType {
  IMAGE,
  AUDIO,
  MODEL,
}

interface Nft {
  chainId: Chain;
  collectionAddress: string;
  tokenId: string;
  memeText: string;
  mediaType: MediaType;
  displayHeight: string;
}

const defaultFormValues: Nft = {
  chainId: Chain.MAINNET,
  collectionAddress: "",
  tokenId: "",
  memeText: "",
  mediaType: MediaType.IMAGE,
  displayHeight: "",
};

export default function Publisher() {
  const [error, setError] = useState<string>("");
  const [nft, setNft] = useState<Nft>(defaultFormValues);
  const [augmentAddress, setAugmentAddress] = useState<Address | null>(null);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const { address: accountAddress } = useAccount();

  const handleSubmit = async (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();

    try {
      setIsDeploying(true);

      const tokenURI = (await readContract({
        chainId: nft.chainId,
        abi: ERC721ABI,
        address: nft.collectionAddress as Address,
        functionName: "tokenURI",
        args: [BigInt(nft.tokenId)],
      })) as string;
      const metadataRes = await fetch(
        tokenURI.startsWith("ipfs://")
          ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
          : tokenURI
      );
      const metadata = await metadataRes.json();
      console.log(metadata);

      if (accountAddress) {
        const walletClient = await getWalletClient({
          chainId: optimismGoerli.id,
        });

        if (walletClient) {
          const deploymentTxHash = await walletClient.deployContract({
            abi: NFTAugmentTemplateABI,
            account: accountAddress,
            args: [
              BigInt(nft.mediaType),
              BigInt(nft.chainId),
              nft.collectionAddress,
              BigInt(nft.tokenId),
            ],
            bytecode: augmentTemplateBytecode,
          });
          const deploymentTx = await waitForTransaction({
            hash: deploymentTxHash,
            chainId: optimismGoerli.id,
          });
          setAugmentAddress(deploymentTx.contractAddress);
          handleClear();
          setError("");
        }
      }
    } catch (err: any) {
      setAugmentAddress(null);
      setError(
        `There was an error while trying to publish the NFT augment,
          please make sure the information provided is right`
      );
      console.error(err);
    }

    setIsDeploying(false);
  };

  const handleClear = () => {
    setError("");
    setNft(defaultFormValues);
  };

  return (
    <>
      <h2 className="text-center fs-4">
        Publish an onchain MUD extension of any NFT for easy display and
        interactivity in AR.
      </h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Chain</Form.Label>
          <div>
            <Form.Check
              type="radio"
              inline
              label="ETH"
              checked={nft.chainId === Chain.MAINNET}
              onChange={() => setNft({ ...nft, chainId: Chain.MAINNET })}
            />
            <Form.Check
              type="radio"
              inline
              label="Polygon"
              checked={nft.chainId === Chain.POLYGON}
              onChange={() => setNft({ ...nft, chainId: Chain.POLYGON })}
            />
            <Form.Check
              type="radio"
              inline
              label="Optimism"
              checked={nft.chainId === Chain.OPTIMISM}
              onChange={() => setNft({ ...nft, chainId: Chain.OPTIMISM })}
            />
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>NFT Collection Address</Form.Label>
          <Form.Control
            type="text"
            placeholder="0x..."
            value={nft.collectionAddress}
            onChange={(e) =>
              setNft({ ...nft, collectionAddress: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>TokenID</Form.Label>
          <Form.Control
            type="text"
            placeholder="0"
            value={nft.tokenId}
            onChange={(e) => setNft({ ...nft, tokenId: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Media Type</Form.Label>
          <div>
            <Form.Check
              type="radio"
              inline
              label="Image"
              checked={nft.mediaType === MediaType.IMAGE}
              onChange={() => setNft({ ...nft, mediaType: MediaType.IMAGE })}
            />
            <Form.Check
              type="radio"
              inline
              label="3D Model"
              checked={nft.mediaType === MediaType.MODEL}
              onChange={() => setNft({ ...nft, mediaType: MediaType.MODEL })}
            />
            <Form.Check
              type="radio"
              inline
              label="Audio"
              checked={nft.mediaType === MediaType.AUDIO}
              onChange={() => setNft({ ...nft, mediaType: MediaType.AUDIO })}
            />
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>
            AR Display Height (Existing image/model dimensions will be
            maintained)
          </Form.Label>
          <div className="d-flex gap-2 align-items-center">
            <Form.Control
              type="text"
              placeholder="10"
              value={nft.displayHeight}
              className="w-20"
              onChange={(e) =>
                setNft({ ...nft, displayHeight: e.target.value })
              }
            />
            <span>meters</span>
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Meme Text</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter text..."
            value={nft.memeText}
            onChange={(e) => setNft({ ...nft, memeText: e.target.value })}
          />
        </Form.Group>
        <div className="d-flex justify-content-center justify-content-lg-end gap-3">
          <Button
            variant="danger"
            className="w-50 w-lg-33 rounded-3"
            onClick={handleClear}
            disabled={
              !nft.collectionAddress &&
              !nft.tokenId &&
              !nft.memeText &&
              !nft.displayHeight
            }
          >
            Clear
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={
              !accountAddress ||
              !nft.collectionAddress ||
              !nft.tokenId ||
              !nft.displayHeight
            }
            className="w-50 w-lg-33 px-3 rounded-3"
          >
            {isDeploying ? (
              <Spinner as="span" size="sm" animation="border">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              <span>Publish Augment</span>
            )}
          </Button>
        </div>
      </Form>
      {error && <p className="mt-3 text-center text-warning">{error}</p>}
      {augmentAddress && (
        <div className="d-flex flex-column align-items-center mt-3 text-success">
          <span className="text-center mt-2">
            Success! Your NFT Augment is deployed to OP Goerli at
          </span>
          <CopyTooltip
            contentClick="Copied"
            contentHover="Copy Address"
            target={
              <>
                <span className="d-lg-none d-flex align-items-center mt-2 text-success">
                  {`${augmentAddress.slice(0, 8)}...${augmentAddress.slice(
                    38,
                    42
                  )}`}{" "}
                  <Image src={CopyIcon} width={18} />
                </span>
                <span className="d-none d-lg-flex align-items-center mt-2 text-success">
                  {augmentAddress}
                  <Image src={CopyIcon} width={18} />
                </span>
              </>
            }
            handleCopy={() => navigator.clipboard.writeText(augmentAddress)}
          />
        </div>
      )}
    </>
  );
}

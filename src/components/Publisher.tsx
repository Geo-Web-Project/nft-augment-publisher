import { useState } from "react";
import { Address } from "wagmi";
import { readContract } from "@wagmi/core";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ERC721ABI from "../abi/ERC721.json";

interface Nft {
  chainId: string;
  collectionAddress: string;
  tokenId: string;
}

export default function Publisher() {
  const [error, setError] = useState<string>("");
  const [nft, setNft] = useState<Nft>({
    chainId: "",
    collectionAddress: "",
    tokenId: "",
  });

  const handleSubmit = async (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();

    try {
      const tokenURI = (await readContract({
        chainId: Number(nft.chainId),
        abi: ERC721ABI,
        address: nft.collectionAddress as Address,
        functionName: "tokenURI",
        args: [BigInt(nft.tokenId)],
      })) as string;
      const metadataRes = await fetch(
        `https://ipfs.io/ipfs/${
          tokenURI.startsWith("ipfs://") ? tokenURI.slice(7) : tokenURI
        }`
      );
      const metadata = await metadataRes.json();

      handleClear();
      setError("");
      console.log(nft, metadata?.image);
    } catch (err: any) {
      setError(
        `There was an error while trying to publish the NFT augment,
          please make sure the information provided is right`
      );
      console.error(err);
    }
  };

  const handleClear = () => {
    setError("");
    setNft({ chainId: "", collectionAddress: "", tokenId: "" });
  };

  return (
    <>
      <h2 className="text-center fs-4">
        Publish an onchain MUD extension of any NFT for easy display and
        interactivity in AR.
      </h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Chain ID</Form.Label>
          <Form.Control
            type="text"
            placeholder="1"
            value={nft.chainId}
            onChange={(e) => setNft({ ...nft, chainId: e.target.value })}
          />
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
        <div className="d-flex justify-content-center justify-content-lg-end gap-3">
          <Button
            variant="danger"
            className="w-50 w-lg-33 rounded-3"
            onClick={handleClear}
            disabled={!nft.chainId && !nft.collectionAddress && !nft.tokenId}
          >
            Clear
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!nft.chainId || !nft.collectionAddress || !nft.tokenId}
            className="w-50 w-lg-33 px-3 rounded-3"
          >
            Publish Augment
          </Button>
        </div>
      </Form>
      {error && <p className="mt-2 text-center text-warning">{error}</p>}
    </>
  );
}

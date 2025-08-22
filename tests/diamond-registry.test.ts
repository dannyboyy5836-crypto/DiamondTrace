import { describe, expect, it, beforeEach, vi } from "vitest";

// Interfaces for type safety
interface ClarityResponse<T> {
  ok: boolean;
  value: T | number; // number for error codes
}

interface DiamondRecord {
  owner: string;
  timestamp: number;
  origin: string;
  geolocation: string;
  metadata: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  status: string;
  isLocked: boolean;
}

// Mock contract implementation
class DiamondRegistryMock {
  private state: {
    diamonds: Map<string, DiamondRecord>;
    paused: boolean;
    admin: string;
  } = {
    diamonds: new Map(),
    paused: false,
    admin: "deployer",
  };

  private ERR_UNAUTHORIZED = 100;
  private ERR_ALREADY_REGISTERED = 101;
  private ERR_INVALID_HASH = 102;
  private ERR_INVALID_ORIGIN = 103;
  private ERR_INVALID_GEOLOCATION = 104;
  private ERR_INVALID_METADATA = 105;
  private ERR_INVALID_CARAT = 110;
  private ERR_INVALID_COLOR = 111;
  private ERR_INVALID_CLARITY = 112;
  private ERR_INVALID_CUT = 113;
  private ERR_NO_AUTHORITY = 114;
  private ERR_MAX_METADATA_LEN = 115;
  private ERR_NOT_OWNER = 108;
  private ERR_PAUSED = 109;
  private ERR_INVALID_STATUS = 107;
  private MAX_METADATA_LEN = 500;
  private MAX_ORIGIN_LEN = 100;
  private MAX_GEOLOCATION_LEN = 50;
  private VALID_COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
  private VALID_CLARITY = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"];
  private VALID_CUTS = ["Ideal", "Excellent", "Very Good", "Good", "Fair"];

  private isValidHash(hash: string): boolean {
    return hash.length > 0;
  }

  private isValidOrigin(origin: string): boolean {
    return origin.length > 0 && origin.length <= this.MAX_ORIGIN_LEN;
  }

  private isValidGeolocation(geolocation: string): boolean {
    return geolocation.length > 0 && geolocation.length <= this.MAX_GEOLOCATION_LEN;
  }

  private isValidMetadata(metadata: string): boolean {
    return metadata.length <= this.MAX_METADATA_LEN;
  }

  private isValidCarat(carat: number): boolean {
    return carat > 0;
  }

  private isValidColor(color: string): boolean {
    return this.VALID_COLORS.includes(color);
  }

  private isValidClarity(clarity: string): boolean {
    return this.VALID_CLARITY.includes(clarity);
  }

  private isValidCut(cut: string): boolean {
    return this.VALID_CUTS.includes(cut);
  }

  private isAuthorizedMiner(caller: string): boolean {
    return caller === this.state.admin; // Mocked for testing
  }

  registerDiamond(
    caller: string,
    hash: string,
    origin: string,
    geolocation: string,
    metadata: string,
    carat: number,
    color: string,
    clarity: string,
    cut: string
  ): ClarityResponse<boolean> {
    if (this.state.paused) {
      return { ok: false, value: this.ERR_PAUSED };
    }
    if (!this.isAuthorizedMiner(caller)) {
      return { ok: false, value: this.ERR_NO_AUTHORITY };
    }
    if (!this.isValidHash(hash)) {
      return { ok: false, value: this.ERR_INVALID_HASH };
    }
    if (this.state.diamonds.has(hash)) {
      return { ok: false, value: this.ERR_ALREADY_REGISTERED };
    }
    if (!this.isValidOrigin(origin)) {
      return { ok: false, value: this.ERR_INVALID_ORIGIN };
    }
    if (!this.isValidGeolocation(geolocation)) {
      return { ok: false, value: this.ERR_INVALID_GEOLOCATION };
    }
    if (!this.isValidMetadata(metadata)) {
      return { ok: false, value: this.ERR_MAX_METADATA_LEN };
    }
    if (!this.isValidCarat(carat)) {
      return { ok: false, value: this.ERR_INVALID_CARAT };
    }
    if (!this.isValidColor(color)) {
      return { ok: false, value: this.ERR_INVALID_COLOR };
    }
    if (!this.isValidClarity(clarity)) {
      return { ok: false, value: this.ERR_INVALID_CLARITY };
    }
    if (!this.isValidCut(cut)) {
      return { ok: false, value: this.ERR_INVALID_CUT };
    }

    this.state.diamonds.set(hash, {
      owner: caller,
      timestamp: Date.now(),
      origin,
      geolocation,
      metadata,
      carat,
      color,
      clarity,
      cut,
      status: "Registered",
      isLocked: false,
    });
    return { ok: true, value: true };
  }

  updateDiamondMetadata(
    caller: string,
    hash: string,
    newMetadata: string,
    newOrigin: string,
    newGeolocation: string
  ): ClarityResponse<boolean> {
    if (this.state.paused) {
      return { ok: false, value: this.ERR_PAUSED };
    }
    const diamond = this.state.diamonds.get(hash);
    if (!diamond) {
      return { ok: false, value: this.ERR_INVALID_HASH };
    }
    if (diamond.owner !== caller) {
      return { ok: false, value: this.ERR_NOT_OWNER };
    }
    if (diamond.isLocked) {
      return { ok: false, value: this.ERR_INVALID_STATUS };
    }
    if (!this.isValidMetadata(newMetadata)) {
      return { ok: false, value: this.ERR_MAX_METADATA_LEN };
    }
    if (!this.isValidOrigin(newOrigin)) {
      return { ok: false, value: this.ERR_INVALID_ORIGIN };
    }
    if (!this.isValidGeolocation(newGeolocation)) {
      return { ok: false, value: this.ERR_INVALID_GEOLOCATION };
    }

    this.state.diamonds.set(hash, {
      ...diamond,
      metadata: newMetadata,
      origin: newOrigin,
      geolocation: newGeolocation,
      timestamp: Date.now(),
    });
    return { ok: true, value: true };
  }

  setDiamondStatus(caller: string, hash: string, status: string, isLocked: boolean): ClarityResponse<boolean> {
    if (this.state.paused) {
      return { ok: false, value: this.ERR_PAUSED };
    }
    const diamond = this.state.diamonds.get(hash);
    if (!diamond) {
      return { ok: false, value: this.ERR_INVALID_HASH };
    }
    if (diamond.owner !== caller) {
      return { ok: false, value: this.ERR_NOT_OWNER };
    }
    if (!["Registered", "Pending", "Certified"].includes(status)) {
      return { ok: false, value: this.ERR_INVALID_STATUS };
    }

    this.state.diamonds.set(hash, {
      ...diamond,
      status,
      isLocked,
      timestamp: Date.now(),
    });
    return { ok: true, value: true };
  }

  pauseContract(caller: string): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    this.state.paused = true;
    return { ok: true, value: true };
  }

  unpauseContract(caller: string): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    this.state.paused = false;
    return { ok: true, value: true };
  }

  setAdmin(caller: string, newAdmin: string): ClarityResponse<boolean> {
    if (caller !== this.state.admin) {
      return { ok: false, value: this.ERR_UNAUTHORIZED };
    }
    this.state.admin = newAdmin;
    return { ok: true, value: true };
  }

  getDiamondDetails(hash: string): ClarityResponse<DiamondRecord | null> {
    return { ok: true, value: this.state.diamonds.get(hash) ?? null };
  }

  isRegistered(hash: string): ClarityResponse<boolean> {
    return { ok: true, value: this.state.diamonds.has(hash) };
  }

  isContractPaused(): ClarityResponse<boolean> {
    return { ok: true, value: this.state.paused };
  }

  getContractAdmin(): ClarityResponse<string> {
    return { ok: true, value: this.state.admin };
  }
}

// Test setup
const accounts = {
  deployer: "deployer",
  miner: "wallet_1",
  user: "wallet_2",
};

describe("DiamondRegistry Contract", () => {
  let contract: DiamondRegistryMock;

  beforeEach(() => {
    contract = new DiamondRegistryMock();
    vi.resetAllMocks();
  });

  it("should allow authorized miner to register a diamond", () => {
    const result = contract.registerDiamond(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Botswana",
      "S24.5,E25.6",
      "1.5 carat rough diamond, mined ethically",
      150,
      "D",
      "VVS1",
      "Excellent"
    );
    expect(result).toEqual({ ok: true, value: true });

    const details = contract.getDiamondDetails("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    expect(details).toEqual({
      ok: true,
      value: expect.objectContaining({
        owner: accounts.deployer,
        origin: "Botswana",
        geolocation: "S24.5,E25.6",
        metadata: "1.5 carat rough diamond, mined ethically",
        carat: 150,
        color: "D",
        clarity: "VVS1",
        cut: "Excellent",
        status: "Registered",
        isLocked: false,
      }),
    });
    expect(contract.isRegistered("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")).toEqual({
      ok: true,
      value: true,
    });
  });

  it("should prevent unauthorized caller from registering", () => {
    const result = contract.registerDiamond(
      accounts.user,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Botswana",
      "S24.5,E25.6",
      "1.5 carat rough diamond",
      150,
      "D",
      "VVS1",
      "Excellent"
    );
    expect(result).toEqual({ ok: false, value: 114 });
  });

  it("should prevent duplicate diamond registration", () => {
    contract.registerDiamond(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Botswana",
      "S24.5,E25.6",
      "1.5 carat rough diamond",
      150,
      "D",
      "VVS1",
      "Excellent"
    );
    const result = contract.registerDiamond(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Namibia",
      "S23.5,E24.6",
      "Another diamond",
      200,
      "E",
      "VS1",
      "Good"
    );
    expect(result).toEqual({ ok: false, value: 101 });
  });

  it("should prevent registration with invalid parameters", () => {
    // Invalid hash
    expect(
      contract.registerDiamond(accounts.deployer, "", "Botswana", "S24.5,E25.6", "Test", 150, "D", "VVS1", "Excellent")
    ).toEqual({ ok: false, value: 102 });

    // Invalid origin
    expect(
      contract.registerDiamond(
        accounts.deployer,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "",
        "S24.5,E25.6",
        "Test",
        150,
        "D",
        "VVS1",
        "Excellent"
      )
    ).toEqual({ ok: false, value: 103 });

    // Invalid geolocation
    expect(
      contract.registerDiamond(
        accounts.deployer,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "Botswana",
        "",
        "Test",
        150,
        "D",
        "VVS1",
        "Excellent"
      )
    ).toEqual({ ok: false, value: 104 });

    // Invalid metadata (too long)
    expect(
      contract.registerDiamond(
        accounts.deployer,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "Botswana",
        "S24.5,E25.6",
        "a".repeat(501),
        150,
        "D",
        "VVS1",
        "Excellent"
      )
    ).toEqual({ ok: false, value: 115 });

    // Invalid carat
    expect(
      contract.registerDiamond(
        accounts.deployer,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "Botswana",
        "S24.5,E25.6",
        "Test",
        0,
        "D",
        "VVS1",
        "Excellent"
      )
    ).toEqual({ ok: false, value: 110 });

    // Invalid color
    expect(
      contract.registerDiamond(
        accounts.deployer,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "Botswana",
        "S24.5,E25.6",
        "Test",
        150,
        "Z",
        "VVS1",
        "Excellent"
      )
    ).toEqual({ ok: false, value: 111 });

    // Invalid clarity
    expect(
      contract.registerDiamond(
        accounts.deployer,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "Botswana",
        "S24.5,E25.6",
        "Test",
        150,
        "D",
        "I1",
        "Excellent"
      )
    ).toEqual({ ok: false, value: 112 });

    // Invalid cut
    expect(
      contract.registerDiamond(
        accounts.deployer,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "Botswana",
        "S24.5,E25.6",
        "Test",
        150,
        "D",
        "VVS1",
        "Poor"
      )
    ).toEqual({ ok: false, value: 113 });
  });

  it("should allow owner to update metadata", () => {
    contract.registerDiamond(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Botswana",
      "S24.5,E25.6",
      "1.5 carat rough diamond",
      150,
      "D",
      "VVS1",
      "Excellent"
    );
    const result = contract.updateDiamondMetadata(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Updated metadata",
      "Namibia",
      "S23.5,E24.6"
    );
    expect(result).toEqual({ ok: true, value: true });

    const details = contract.getDiamondDetails("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    expect(details).toEqual({
      ok: true,
      value: expect.objectContaining({
        metadata: "Updated metadata",
        origin: "Namibia",
        geolocation: "S23.5,E24.6",
      }),
    });
  });

  it("should prevent non-owner from updating metadata", () => {
    contract.registerDiamond(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Botswana",
      "S24.5,E25.6",
      "1.5 carat rough diamond",
      150,
      "D",
      "VVS1",
      "Excellent"
    );
    const result = contract.updateDiamondMetadata(
      accounts.user,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Updated metadata",
      "Namibia",
      "S23.5,E24.6"
    );
    expect(result).toEqual({ ok: false, value: 108 });
  });

  it("should allow owner to set status and lock", () => {
    contract.registerDiamond(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Botswana",
      "S24.5,E25.6",
      "1.5 carat rough diamond",
      150,
      "D",
      "VVS1",
      "Excellent"
    );
    const result = contract.setDiamondStatus(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Certified",
      true
    );
    expect(result).toEqual({ ok: true, value: true });

    const details = contract.getDiamondDetails("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    expect(details).toEqual({
      ok: true,
      value: expect.objectContaining({
        status: "Certified",
        isLocked: true,
      }),
    });
  });

  it("should prevent invalid status updates", () => {
    contract.registerDiamond(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Botswana",
      "S24.5,E25.6",
      "1.5 carat rough diamond",
      150,
      "D",
      "VVS1",
      "Excellent"
    );
    const result = contract.setDiamondStatus(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Invalid",
      true
    );
    expect(result).toEqual({ ok: false, value: 107 });
  });

  it("should allow admin to pause and unpause contract", () => {
    const pauseResult = contract.pauseContract(accounts.deployer);
    expect(pauseResult).toEqual({ ok: true, value: true });
    expect(contract.isContractPaused()).toEqual({ ok: true, value: true });

    const registerDuringPause = contract.registerDiamond(
      accounts.deployer,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Botswana",
      "S24.5,E25.6",
      "Test",
      150,
      "D",
      "VVS1",
      "Excellent"
    );
    expect(registerDuringPause).toEqual({ ok: false, value: 109 });

    const unpauseResult = contract.unpauseContract(accounts.deployer);
    expect(unpauseResult).toEqual({ ok: true, value: true });
    expect(contract.isContractPaused()).toEqual({ ok: true, value: false });
  });

  it("should allow admin to change admin", () => {
    const result = contract.setAdmin(accounts.deployer, accounts.miner);
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.getContractAdmin()).toEqual({ ok: true, value: accounts.miner });
  });

  it("should prevent non-admin from pausing or changing admin", () => {
    expect(contract.pauseContract(accounts.user)).toEqual({ ok: false, value: 100 });
    expect(contract.setAdmin(accounts.user, accounts.miner)).toEqual({ ok: false, value: 100 });
  });
});
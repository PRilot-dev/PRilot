import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/server/encryption";

describe("encrypt / decrypt", () => {
	it("roundtrips a simple string", () => {
		// ARRANGE
		const plaintext = "hello world";

		// ACT
		const encrypted = encrypt(plaintext);
		const decrypted = decrypt(encrypted);

		// ASSERT
		expect(decrypted).toBe(plaintext);
	});

	it("roundtrips a long string with special characters", () => {
		// ARRANGE
		const plaintext = "ghp_abc123!@#$%^&*()_+-={}[]|\\:\";<>?,./~`\n\ttabs and newlines";

		// ACT
		const encrypted = encrypt(plaintext);
		const decrypted = decrypt(encrypted);

		// ASSERT
		expect(decrypted).toBe(plaintext);
	});

	it("produces different ciphertexts for the same plaintext (random IV)", () => {
		// ARRANGE
		const plaintext = "same input";

		// ACT
		const a = encrypt(plaintext);
		const b = encrypt(plaintext);

		// ASSERT
		expect(a).not.toBe(b);
	});

	it("throws on tampered ciphertext", () => {
		// ARRANGE
		const encrypted = encrypt("secret");
		const tampered = encrypted.slice(0, -2) + "xx";

		// ACT & ASSERT
		expect(() => decrypt(tampered)).toThrow();
	});

	it("roundtrips an empty string", () => {
		// ACT
		const encrypted = encrypt("");

		// ASSERT
		expect(decrypt(encrypted)).toBe("");
	});
});

import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/server/escapeHtml";

describe("escapeHtml", () => {
	it("escapes ampersands", () => {
		// ACT & ASSERT
		expect(escapeHtml("a & b")).toBe("a &amp; b");
	});

	it("escapes angle brackets", () => {
		// ACT & ASSERT
		expect(escapeHtml("<script>alert('xss')</script>")).toBe(
			"&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
		);
	});

	it("escapes double quotes", () => {
		// ACT & ASSERT
		expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
	});

	it("escapes single quotes", () => {
		// ACT & ASSERT
		expect(escapeHtml("it's")).toBe("it&#39;s");
	});

	it("escapes all special characters together", () => {
		// ACT & ASSERT
		expect(escapeHtml('<a href="x" data-val=\'y\'>&')).toBe(
			"&lt;a href=&quot;x&quot; data-val=&#39;y&#39;&gt;&amp;",
		);
	});

	it("returns plain text unchanged", () => {
		// ACT & ASSERT
		expect(escapeHtml("hello world")).toBe("hello world");
	});

	it("handles empty string", () => {
		// ACT & ASSERT
		expect(escapeHtml("")).toBe("");
	});
});

import { schema_to_typeddict } from "../schema-to-typedDict";

function normalize(s: string) {
  // Normalize line endings, trim outer whitespace, strip leading indentation
  const t = s.replace(/\r\n/g, "\n").trim();
  return t
    .split("\n")
    .map((line) => line.replace(/^\s+/, ""))
    .join("\n");
}

describe("schema_to_typeddict - type generation", () => {
  test("primitives map to Python types", () => {
    const schema = `
    {
      name: string;
      age: int;
      score: number;
      active: boolean;
    }
    `;
    const expected = `
    class Root(TypedDict):
        name: str
        age: int
        score: float
        active: bool
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("optional fields use NotRequired", () => {
    const schema = `
    {
      name: string;
      nickname?: string;
    }
    `;
    const expected = `
    class Root(TypedDict):
        name: str
        nickname: NotRequired[str]
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("arrays and nested objects (bottom-up order)", () => {
    const schema = `
    {
      tags: Array<string>;
      items: Array<{ id: int; meta: { createdAt: string } }>;
    }
    `;
    const expected = `
    class Root_items_meta(TypedDict):
        createdAt: str

    class Root_items(TypedDict):
        id: int
        meta: Root_items_meta

    class Root(TypedDict):
        tags: list[str]
        items: list[Root_items]
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("Record<string, T> maps to Mapping[str, T] and nested objects are named", () => {
    const schema = `
    {
      dict: Record<string, number>;
      meta: Record<string, { x: int; y: int }>;
    }
    `;
    const expected = `
    class Root_meta(TypedDict):
        x: int
        y: int

    class Root(TypedDict):
        dict: Mapping[str, float]
        meta: Mapping[str, Root_meta]
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("union of base types uses |", () => {
    const schema = `
    {
      v: string | int | boolean;
    }
    `;
    const expected = `
    class Root(TypedDict):
        v: str | int | bool
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("rootName parameter influences class names", () => {
    const schema = `
    {
      user: { id: int };
    }
    `;
    const expected = `
    class MyRoot_user(TypedDict):
        id: int

    class MyRoot(TypedDict):
        user: MyRoot_user
    `;
    const out = schema_to_typeddict(schema, "MyRoot");
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("union of string literals collapses to Literal[...]", () => {
    const schema = `
    {
      status: 'a' | 'b' | "c";
    }
    `;
    const expected = `
    class Root(TypedDict):
        status: Literal["a", "b", "c"]
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("union of objects creates distinct class names and references", () => {
    const schema = `
    {
      value: { a: int } | { b: string };
    }
    `;
    const expected = `
    class Root_value(TypedDict):
        a: int

    class Root_value2(TypedDict):
        b: str

    class Root(TypedDict):
        value: Root_value | Root_value2
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("invalid Python identifiers trigger TypedDict(...) mapping style", () => {
    const schema = `
    {
      class: string;
      value: int;
    }
    `;
    const expected = `
    Root = TypedDict("Root", {
        "class": str,
        "value": int
    })
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("empty object type renders as Mapping[str, object] and emits no class", () => {
    const schema = `
    {
      data: {};
    }
    `;
    const expected = `
    class Root(TypedDict):
        data: Mapping[str, object]
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
    // Ensure no standalone class for the empty object
    expect(out).not.toMatch(/class\s+Root_data\(TypedDict\):/);
  });

  test("unknown tokens map to Any", () => {
    const schema = `
    {
      weird: %;
    }
    `;
    const expected = `
    class Root(TypedDict):
        weird: Any
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("identical sibling shapes are de-duplicated under a single class name", () => {
    const schema = `
    {
      a: { x: int };
      b: { x: int };
    }
    `;
    const expected = `
    class Root_a(TypedDict):
        x: int

    class Root(TypedDict):
        a: Root_a
        b: Root_a
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
    // Ensure only one class for the shared shape
    expect((out.match(/class\s+Root_a\(TypedDict\):/g) || []).length).toBe(1);
  });

  test("Record with non-string key throws", () => {
    const schema = `
    {
      bad: Record<number, string>;
    }
    `;
    expect(() => schema_to_typeddict(schema)).toThrow(/Only Record<string, \.\.\.> supported/);
  });

  test("unexpected trailing tokens after root object throws", () => {
    const schema = `
    { a: int } extra
    `;
    expect(() => schema_to_typeddict(schema)).toThrow(/Unexpected trailing tokens/);
  });

  test("naming collision produces uniquified class names", () => {
    const schema = `
    {
      a: { b: { d: string } };
      a_b: { c: int };
    }
    `;
    const expected = `
    class Root_a_b(TypedDict):
        d: str

    class Root_a(TypedDict):
        b: Root_a_b

    class Root_a_b2(TypedDict):
        c: int

    class Root(TypedDict):
        a: Root_a
        a_b: Root_a_b2
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("identical shapes are reused across different paths (including arrays)", () => {
    const schema = `
    {
      a: { x: int };
      arr: Array<{ x: int }>;
    }
    `;
    const out = schema_to_typeddict(schema);
    // One class for the shared shape
    expect((out.match(/class\s+Root_a\(TypedDict\):/g) || []).length).toBe(1);
    // Both fields reference the same class
    expect(out).toMatch(/a:\s+Root_a/);
    expect(out).toMatch(/arr:\s+list\[Root_a\]/);
  });

  test("union of object and literal is rendered with Literal[...] on the right", () => {
    const schema = `
    {
      v: { a: int } | 'ok';
    }
    `;
    const expected = `
    class Root_v(TypedDict):
        a: int

    class Root(TypedDict):
        v: Root_v | Literal["ok"]
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("top-level non-object schema throws", () => {
    const schema = `string`;
    expect(() => schema_to_typeddict(schema)).toThrow(/Expected LBRACE/);
  });

  test("Array generic missing closing '>' throws", () => {
    const schema = `
    {
      bad: Array<int;
    }
    `;
    expect(() => schema_to_typeddict(schema)).toThrow(/Expected GREATER_THAN/);
  });

  test("unknown identifier type throws", () => {
    const schema = `
    {
      v: float;
    }
    `;
    expect(() => schema_to_typeddict(schema)).toThrow(/Unexpected token/);
  });

  test("multiple separators are tolerated and field order is preserved", () => {
    const schema = `
    {
      z: int;;;;
      a: string,,
      m: boolean;
    }
    `;
    const expected = `
    class Root(TypedDict):
        z: int
        a: str
        m: bool
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("nested object with python keywords falls back to mapping style only for that class", () => {
    const schema = `
    {
      outer: { def: int; ok: int };
      fine: int;
    }
    `;
    const expected = `
    Root_outer = TypedDict("Root_outer", {
        "def": int,
        "ok": int
    })

    class Root(TypedDict):
        outer: Root_outer
        fine: int
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("invalid rootName falls back to 'Type' base name (and uniquifies child)", () => {
    const schema = `
    {
      x: { y: int };
    }
    `;
    const expected = `
    class Type2(TypedDict):
        y: int

    class Type(TypedDict):
        x: Type2
    `;
    const out = schema_to_typeddict(schema, "123Root");
    expect(normalize(out)).toBe(normalize(expected));
  });

  test("MappingType with nested object that requires mapping style", () => {
    const schema = `
    {
      meta: Record<string, { class: number; keep: int }>;
    }
    `;
    const expected = `
    Root_meta = TypedDict("Root_meta", {
        "class": float,
        "keep": int
    })

    class Root(TypedDict):
        meta: Mapping[str, Root_meta]
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expected));
  });

  // Known oddities we highlight as failing tests to avoid breaking CI
  // 1) Duplicated literals in unions are not de-duplicated
  test.failing("union of literals preserves duplicates (should likely de-duplicate)", () => {
    const schema = `
    {
      u: 'a' | 'a' | 'b' | 'c' | 'b';
    }
    `;
    const expectedIdeal = `
    class Root(TypedDict):
        u: Literal["a", "b", "c"]
    `;
    const out = schema_to_typeddict(schema);
    // Current behavior includes duplicates; we assert ideal behavior
    expect(normalize(out)).toBe(normalize(expectedIdeal));
  });

  // 2) Duplicate object members in a union are not de-duplicated
  test.failing("union of identical objects should collapse to a single reference", () => {
    const schema = `
    {
      value: { x: int } | { x: int };
    }
    `;
    const expectedIdeal = `
    class Root_value(TypedDict):
        x: int

    class Root(TypedDict):
        value: Root_value
    `;
    const out = schema_to_typeddict(schema);
    expect(normalize(out)).toBe(normalize(expectedIdeal));
  });

});

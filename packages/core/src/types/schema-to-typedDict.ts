// Generates Python TypedDict code from a concise schema language.
// ================================================================
// Behavior preserved: no change in parsing, typing, naming, or output.
// ================================================================

// === AST TYPES ===================================================

export interface Base { node: "Base"; kind: string; }
export interface UnknownT { node: "Unknown"; }
export interface EnumT { node: "Enum"; options: string[]; }
export interface MappingType { node: "MappingType"; value: TypeNode; }
export interface ArrayT { node: "Array"; item: TypeNode; }
export interface Field { name: string; typ: TypeNode; optional: boolean; }

/**
 * We annotate Obj nodes with a name during collection.
 * This replaces the previous TDClass wrapper without changing behavior.
 */
export interface Obj { node: "Obj"; fields: ReadonlyArray<Field>; name?: string; }

export interface UnionT { node: "Union"; members: ReadonlyArray<TypeNode>; }
export type TypeNode = Base | MappingType | ArrayT | Obj | EnumT | UnionT | UnknownT;

// === TOKENIZER ===================================================

type TokKind =
  | "LBRACE" | "RBRACE" | "COLON" | "SEMI" | "QUESTION_MARK" | "COMMA"
  | "LESS_THAN" | "GREATER_THAN" | "IDENT" | "KEY_WORD" | "PIPE"
  | "STRING_LITERAL" | "UNKNOWN";

export interface Tok { kind: TokKind; value: string; pos: number; }

const KWDS = new Set(["string", "number", "int", "boolean"]);
const SINGLE: Record<string, TokKind> = {
  "{": "LBRACE", "}": "RBRACE", ":": "COLON", ";": "SEMI", "?": "QUESTION_MARK",
  ",": "COMMA", "<": "LESS_THAN", ">": "GREATER_THAN", "|": "PIPE",
};

const isAlpha = (c: string) => /[A-Za-z_]/.test(c);
const isAlnum = (c: string) => /[A-Za-z0-9_]/.test(c);

export function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) { i++; continue; }

    const kind = SINGLE[c];
    if (kind) { out.push({ kind, value: c, pos: i++ }); continue; }

    if (isAlpha(c)) {
      let j = i + 1;
      while (j < src.length && isAlnum(src[j]!)) j++;
      const word = src.slice(i, j);
      out.push({ kind: KWDS.has(word) ? "KEY_WORD" : "IDENT", value: word, pos: i });
      i = j; continue;
    }

    if (c === "'" || c === '"') {
      const quote = c; let j = i + 1, buf = "";
      while (j < src.length) {
        const ch = src[j]!;
        if (ch === "\\" && j + 1 < src.length) { buf += src[j + 1]!; j += 2; continue; }
        if (ch === quote) { j++; break; }
        buf += ch; j++;
      }
      if (j > src.length) throw new SyntaxError(`Unterminated string starting at ${i}`);
      out.push({ kind: "STRING_LITERAL", value: buf, pos: i });
      i = j; continue;
    }

    // Preserve current semantics: unknown chars become UNKNOWN tokens.
    out.push({ kind: "UNKNOWN", value: c, pos: i++ });
  }
  return out;
}

// === PARSER ======================================================

class Parser {
  private i = 0;
  constructor(private toks: Tok[], private src = "") {}

  private peek(k = 0): Tok | null {
    const j = this.i + k;
    return j >= 0 && j < this.toks.length ? this.toks[j]! : null;
  }

  private want(kind: TokKind): Tok {
    const t = this.peek();
    if (!t || t.kind !== kind) {
      const got = t ? t.kind : "EOF";
      const pos = t ? t.pos : "EOF";
      throw new SyntaxError(`Expected ${kind}, got ${got} at pos ${pos}. The source schema is : ${this.src}`);
    }
    this.i++; return t;
  }

  private accept(kind: TokKind): Tok | null {
    const t = this.peek();
    if (t && t.kind === kind) { this.i++; return t; }
    return null;
  }

  parse_root_schema(): Obj { return this.parse_object(); }

  private parse_object(): Obj {
    this.want("LBRACE");
    const fields: Field[] = [];
    while (this.peek() && this.peek()!.kind !== "RBRACE") {
      fields.push(this.parse_field());
      while (this.accept("SEMI") || this.accept("COMMA")) {}
    }
    this.want("RBRACE");
    return { node: "Obj", fields };
  }

  private parse_field(): Field {
    const name = this.want("IDENT").value;
    const optional = !!this.accept("QUESTION_MARK");
    this.want("COLON");
    return { name, typ: this.parse_type(), optional };
  }

  private parse_type(): TypeNode {
    const members: TypeNode[] = [this.parse_atomic()];
    while (this.accept("PIPE")) members.push(this.parse_atomic());
    if (members.length === 1) return members[0];

    const flat: TypeNode[] = [];
    for (const m of members) (m.node === "Union") ? flat.push(...m.members) : flat.push(m);

    if (flat.every(m => m.node === "Enum" && (m as EnumT).options.length === 1))
      return { node: "Enum", options: flat.map(e => (e as EnumT).options[0]!) };

    return { node: "Union", members: flat };
  }

  private parse_atomic(): TypeNode {
    const t = this.peek();
    if (!t) throw new SyntaxError("Unexpected EOF while parsing Type");

    // 'a' | 'b' | 'c'
    if (t.kind === "STRING_LITERAL") {
      const options: string[] = [this.want("STRING_LITERAL").value];
      while (this.accept("PIPE")) {
        if (this.peek()?.kind !== "STRING_LITERAL")
          throw new SyntaxError(`Exprected String Literal at position: ${this.peek()?.pos ?? "EOF"}`);
        options.push(this.want("STRING_LITERAL").value);
      }
      return { node: "Enum", options };
    }

    // { ... } or {}
    if (t.kind === "LBRACE") {
      if (this.peek(1)?.kind === "RBRACE") {
        this.want("LBRACE"); this.want("RBRACE");
        return { node: "Obj", fields: [] };
      }
      return this.parse_object();
    }

    // Array<T>
    if (t.kind === "IDENT" && t.value === "Array") {
      this.want("IDENT"); this.want("LESS_THAN");
      const val = this.parse_atomic();
      this.want("GREATER_THAN");
      return { node: "Array", item: val };
    }

    // Record<string, T>
    if (t.kind === "IDENT" && t.value === "Record") {
      this.want("IDENT"); this.want("LESS_THAN");
      const k = this.want("KEY_WORD");
      if (k.value !== "string")
        throw new SyntaxError(`Only Record<string, ...> supported at pos ${k.pos}`);
      this.want("COMMA");
      const val = this.parse_atomic();
      this.want("GREATER_THAN");
      return { node: "MappingType", value: val };
    }

    // Base keywords, Unknown
    if (t.kind === "KEY_WORD") return { node: "Base", kind: this.want("KEY_WORD").value };
    if (t.kind === "UNKNOWN") { this.want("UNKNOWN"); return { node: "Unknown" }; }

    throw new SyntaxError(`Unexpected token ${JSON.stringify(t)} in Primary. The source schema was : ${this.src}`);
  }
}

export function parse_schema(src: string): Obj {
  const p = new Parser(tokenize(src), src);
  const root = p.parse_root_schema();
  if ((p as any)["peek"]()) {
    const t = (p as any)["peek"]();
    throw new SyntaxError(`Unexpected trailing tokens at pos ${t && t.pos}`);
  }
  return root;
}

// === HELPERS =====================================================

const PYTHON_KEYWORDS = new Set([
  "False","None","True","and","as","assert","async","await","break","class",
  "continue","def","del","elif","else","except","finally","for","from","global",
  "if","import","in","is","lambda","nonlocal","not","or","pass","raise","return",
  "try","while","with","yield"
]);

export const valid_identifier = (n: string) =>
  /^[A-Za-z_]\w*$/.test(n) && !PYTHON_KEYWORDS.has(n);

// === TYPE SIGNATURE ==============================================

export type Sig =
  | ["base", string]
  | ["array", Sig]
  | ["obj", ReadonlyArray<[string, boolean, Sig]>]
  | ["mapping", Sig]
  | ["enum", string[]]
  | ["union", Sig[]]
  | ["unknown"];

export function type_signature(t: TypeNode): Sig {
  switch (t.node) {
    case "Base": return ["base", t.kind];
    case "Array": return ["array", type_signature(t.item)];
    case "MappingType": return ["mapping", type_signature(t.value)];
    case "Unknown": return ["unknown"];
    case "Enum": return ["enum", [...t.options].sort()];
    case "Obj": {
      const items = [...t.fields]
        .map(f => [f.name, f.optional, type_signature(f.typ)] as [string, boolean, Sig])
        .sort((a, b) => a[0].localeCompare(b[0]));
      return ["obj", items];
    }
    case "Union": {
      const parts = t.members.map(type_signature);
      const sorted = parts.map(p => JSON.stringify(p)).sort().map(s => JSON.parse(s));
      return ["union", sorted];
    }
  }
}

// === OBJECT COLLECTION (names on Obj) ============================

function uniquify(base: string, used: Set<string>): string {
  if (!used.has(base)) { used.add(base); return base; }
  let k = 2; while (used.has(`${base}${k}`)) k++;
  const name = `${base}${k}`; used.add(name); return name;
}

function name_for_obj(obj: Obj, path: string[], map: Map<string, string>, used: Set<string>): string {
  const sig = JSON.stringify(type_signature(obj));
  const found = map.get(sig);
  if (found) return found;
  let raw = path.filter(Boolean).join("_") || "Root";
  if (!valid_identifier(raw)) raw = "Type";
  const name = uniquify(raw, used);
  map.set(sig, name);
  return name;
}

/**
 * Walk the tree, assign stable names to Obj nodes, and
 * return the ordered list of unique named objects plus the signature→name map.
 */
export function collect_objects(root: Obj, root_hint = "Root") {
  const nameMap = new Map<string, string>(), used = new Set<string>();
  const orderedObjs: Obj[] = [];           // unique, in stable order
  const seenNames = new Set<string>();     // dedupe by assigned class name

  const visit = (t: TypeNode, path: string[]) => {
    if (t.node === "Obj") {
      if (!t.fields.length) return;

      // Assign/lookup a stable name by structural signature.
      const name = name_for_obj(t, path, nameMap, used);
      t.name = name; // annotate Obj directly

      if (!seenNames.has(name)) {
        // Visit children first to keep the existing bottom-up order.
        for (const f of t.fields) visit(f.typ, path.concat(f.name));
        seenNames.add(name);
        orderedObjs.push(t);
      }
    } else if (t.node === "Array") {
      visit(t.item, path);
    } else if (t.node === "MappingType") {
      visit(t.value, path);
    } else if (t.node === "Union") {
      t.members.forEach(m => visit(m, path));
    }
  };

  visit(root, [root_hint]);
  return { objs: orderedObjs, name_of: nameMap };
}

// === PYTHON TYPE MAPPING =========================================

export function py_type(t: TypeNode, name_of: Map<string, string>): string {
  switch (t.node) {
    case "Base":
      return t.kind === "string" ? "str"
        : t.kind === "number" ? "float"
        : t.kind === "int" ? "int"
        : t.kind === "boolean" ? "bool"
        : t.kind === "emptyobj" ? "Mapping[str, object]" : "Any";
    case "Array": return `list[${py_type(t.item, name_of)}]`;
    case "Obj": {
      if (!t.fields.length) return "Mapping[str, object]";
      const key = JSON.stringify(type_signature(t));
      const name = name_of.get(key);
      if (!name) throw new Error("Unresolved object name for signature");
      return name;
    }
    case "MappingType": return `Mapping[str, ${py_type(t.value, name_of)}]`;
    case "Enum": return `Literal[${t.options.map(o => JSON.stringify(o)).join(", ")}]`;
    case "Union": return t.members.map(m => py_type(m, name_of)).join(" | ");
    case "Unknown": return "Any";
  }
}

// === RENDERER ====================================================

export function render_typeddicts(root: Obj, rootName = "Root"): string {
  const { objs, name_of } = collect_objects(root, rootName);
  const opt = (s: string, o: boolean) => (o ? `NotRequired[${s}]` : s);
  const lines: string[] = [];

  for (const obj of objs) {
    const clsName = obj.name!; // assigned in collect_objects
    const fields = obj.fields;

    const all_valid = fields.every(f => valid_identifier(f.name));
    if (all_valid) {
      lines.push(`class ${clsName}(TypedDict):`);
      if (!fields.length) {
        lines.push("    pass");
      } else {
        for (const f of fields) {
          lines.push(`    ${f.name}: ${opt(py_type(f.typ, name_of), f.optional)}`);
        }
      }
    } else {
      lines.push(`${clsName} = TypedDict("${clsName}", {`);
      fields.forEach((f, i) => {
        const comma = i < fields.length - 1 ? "," : "";
        lines.push(`    ${JSON.stringify(f.name)}: ${opt(py_type(f.typ, name_of), f.optional)}${comma}`);
      });
      lines.push("})");
    }
    lines.push("");
  }

  return lines.join("\n");
}

// === ENTRY POINT =================================================

export function schema_to_typeddict(src: string, rootName = "Root"): string {
  return render_typeddicts(parse_schema(src), rootName);
}

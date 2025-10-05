interface Base { node: "Base"; kind: string; }
interface UnknownT { node: "Unknown"; }
interface EnumT { node: "Enum"; options: string[]; }
interface MappingType { node: "MappingType"; value: TypeNode; }
interface ArrayT { node: "Array"; item: TypeNode; }
interface Field { name: string; typ: TypeNode; optional: boolean; }
interface Obj { node: "Obj"; fields: ReadonlyArray<Field>; name?: string; }

interface UnionT { node: "Union"; members: ReadonlyArray<TypeNode>; }
type TypeNode = Base | MappingType | ArrayT | Obj | EnumT | UnionT | UnknownT;

// === TOKENIZER =====================================================

type TokKind =
  | "LBRACE" | "RBRACE" | "COLON" | "SEMI" | "QUESTION_MARK" | "COMMA"
  | "LESS_THAN" | "GREATER_THAN" | "IDENT" | "KEY_WORD" | "PIPE"
  | "STRING_LITERAL" | "UNKNOWN";

interface Tok { kind: TokKind; value: string; pos: number; }

const KWDS = new Set(["string", "number", "int", "boolean"]);
const SINGLE: Record<string, TokKind> = {
  "{": "LBRACE", "}": "RBRACE", ":": "COLON", ";": "SEMI", "?": "QUESTION_MARK",
  ",": "COMMA", "<": "LESS_THAN", ">": "GREATER_THAN", "|": "PIPE",
};

const isAlpha = (c: string) => /[A-Za-z_]/.test(c);
const isAlnum = (c: string) => /[A-Za-z0-9_]/.test(c);

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  for (let i = 0; i < src.length; ) {
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
      const quote = c;
      let j = i + 1, buf = "";
      while (j < src.length) {
        const ch = src[j]!;
        if (ch === "\\" && j + 1 < src.length) { buf += src[j + 1]!; j += 2; continue; }
        if (ch === quote) { j++; break; }
        buf += ch; j++;
      }

      out.push({ kind: "STRING_LITERAL", value: buf, pos: i });
      i = j; continue;
    }

    out.push({ kind: "UNKNOWN", value: c, pos: i++ });
  }
  return out;
}

// === PARSER ========================================================

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
  public eof(): boolean { return this.i >= this.toks.length; }
  public pos(): number | "EOF" { return this.peek()?.pos ?? "EOF"; }

  parse_object(): Obj {
    this.want("LBRACE");
    const fields: Field[] = [];
    for (let t = this.peek(); t && t.kind !== "RBRACE"; t = this.peek()) {
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

    // Flatten nested unions and detect union of single-literal enums.
    const flat = members.flatMap(m => (m.node === "Union" ? (m as UnionT).members : [m]));
    const isSingleLiteralEnum = flat.every(m => m.node === "Enum" && (m as EnumT).options.length === 1);
    return isSingleLiteralEnum
      ? { node: "Enum", options: flat.map(e => (e as EnumT).options[0]!) }
      : { node: "Union", members: flat };
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

    // { ... }
    if (t.kind === "LBRACE") return this.parse_object();

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

function parse_schema(src: string): Obj {
  const p = new Parser(tokenize(src), src);
  const root = p.parse_object();
  if (!p.eof()) throw new SyntaxError(`Unexpected trailing tokens at pos ${p.pos()}`);
  return root;
}

// === HELPERS ======================================================

const PYTHON_KEYWORDS = new Set([
  "False","None","True","and","as","assert","async","await","break","class",
  "continue","def","del","elif","else","except","finally","for","from","global",
  "if","import","in","is","lambda","nonlocal","not","or","pass","raise","return",
  "try","while","with","yield"
]);

const valid_identifier = (n: string) =>
  /^[A-Za-z_]\w*$/.test(n) && !PYTHON_KEYWORDS.has(n);

// === TYPE SIGNATURE ===============================================

type Sig =
  | ["base", string]
  | ["array", Sig]
  | ["obj", ReadonlyArray<[string, boolean, Sig]>]
  | ["mapping", Sig]
  | ["enum", string[]]
  | ["union", Sig[]]
  | ["unknown"];

function type_signature(t: TypeNode): Sig {
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
    }case "Union": {
      const parts = t.members.map(type_signature);
      const sorted = parts
        .map((p) => JSON.stringify(p))
        .sort()
        .map((s) => JSON.parse(s) as Sig);
      return ["union", sorted];
    }
  }
}

// === OBJECT COLLECTION ============================================

function uniquify(base: string, used: Set<string>): string {
  if (!used.has(base)) { used.add(base); return base; }
  let k = 2; while (used.has(`${base}${k}`)) k++;
  const name = `${base}${k}`; used.add(name); return name;
}

function name_for_obj(obj: Obj, path: string[], nameMap: Map<string, string>, used: Set<string>): string {
  const sig = JSON.stringify(type_signature(obj));
  const found = nameMap.get(sig);
  if (found) return found;

  let raw = path.filter(Boolean).join("_") || "Root";
  if (!valid_identifier(raw)) raw = "Type";

  const name = uniquify(raw, used);
  nameMap.set(sig, name);
  return name;
}

/**
 * Walks the tree, assigns stable names to Obj nodes,
 * returns ordered list of unique objects (bottom-up).
 */
function collect_objects(root: Obj, root_hint = "Root") {
  const nameMap = new Map<string, string>();
  const used = new Set<string>();
  const orderedObjs: Obj[] = [];
  const seenNames = new Set<string>();

  const visit = (t: TypeNode, path: string[]) => {
    switch (t.node) {
      case "Obj": {
        if (!t.fields.length) return;

        const name = name_for_obj(t, path, nameMap, used);
        t.name = name;

        if (!seenNames.has(name)) {
          // visit children first for bottom-up ordering
          for (const f of t.fields) visit(f.typ, path.concat(f.name));
          seenNames.add(name);
          orderedObjs.push(t);
        }
        break;
      }
      case "Array": visit(t.item, path); break;
      case "MappingType": visit(t.value, path); break;
      case "Union": t.members.forEach(m => visit(m, path)); break;
      default: break;
    }
  };

  visit(root, [root_hint]);
  return { objs: orderedObjs };
}

// === PYTHON TYPE MAPPING ==========================================

function py_type(t: TypeNode): string {
  switch (t.node) {
    case "Base":
      return t.kind === "string" ? "str"
        : t.kind === "number" ? "float"
        : t.kind === "int" ? "int"
        : t.kind === "boolean" ? "bool"
        : "Any";
    case "Array": return `list[${py_type(t.item)}]`;
    case "Obj":
      if (!t.fields.length) return "Mapping[str, object]";
      if (!t.name) throw new Error("Invariant violated: Obj.name not set. Run collect_objects first.");
      return t.name;
    case "MappingType": return `Mapping[str, ${py_type(t.value)}]`;
    case "Enum": return `Literal[${t.options.map(o => JSON.stringify(o)).join(", ")}]`;
    case "Union": return t.members.map(py_type).join(" | ");
    case "Unknown": return "Any";
  }
}

// === RENDERER =====================================================

function render_typeddicts(root: Obj, rootName = "Root"): string {
  const { objs } = collect_objects(root, rootName);
  const opt = (s: string, o: boolean) => (o ? `NotRequired[${s}]` : s);
  const lines: string[] = [];

  for (const obj of objs) {
    const clsName = obj.name!; // assigned in collect_objects
    const fields = obj.fields;

    const all_valid = fields.every(f => valid_identifier(f.name));
    if (all_valid) {
      lines.push(`class ${clsName}(TypedDict):`);
      for (const f of fields) {
        lines.push(`    ${f.name}: ${opt(py_type(f.typ), f.optional)}`);
      }
    } else {
      lines.push(`${clsName} = TypedDict("${clsName}", {`);
      fields.forEach((f, i) => {
        const comma = i < fields.length - 1 ? "," : "";
        lines.push(`    ${JSON.stringify(f.name)}: ${opt(py_type(f.typ), f.optional)}${comma}`);
      });
      lines.push("})");
    }
    lines.push("");
  }

  return lines.join("\n");
}

// === ENTRY POINT ==================================================

export function schema_to_typeddict(src: string, rootName = "Root"): string {
  const root: TypeNode = parse_schema(src);
  return render_typeddicts(root, rootName);
}

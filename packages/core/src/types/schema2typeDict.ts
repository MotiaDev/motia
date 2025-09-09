// Generates Python TypedDict code from a concise schema language.

import { unknown } from "zod";

// ---------------- AST ----------------

export type TypeNode = Base | MappingType | ArrayT | Obj | UnknownT;

export interface Base {
  node: "Base";
  kind: string; // "string" | "number" | "int" | "boolean" | "emptyobj" (unused)
}

export interface MappingType {
  node: "MappingType";
  value: TypeNode; // Record<string, Value>
}

export interface ArrayT {
  node: "Array";
  item: TypeNode;
}

export interface Field {
  name: string;
  typ: TypeNode;
  optional: boolean;
}

export interface Obj {
  node: "Obj";
  fields: ReadonlyArray<Field>;
}

export interface UnknownT {
  node: "Unknown";
}

// ---------------- Tokenizer ----------------

type TokKind =
  | "SQBRACKETS"
  | "LBRACE"
  | "RBRACE"
  | "COLON"
  | "SEMI"
  | "Q"
  | "COMMA"
  | "LT"
  | "GT"
  | "IDENT"
  | "KW"
  | "UNKNOWN";

export interface Tok {
  kind: TokKind;
  value: string;
  pos: number; // index for error messages
}

const KWDS = new Set(["string", "number", "int", "boolean"]);

export function tokenize(src: string): Tok[] {
  const s = src;
  let i = 0;
  const out: Tok[] = [];
  while (i < s.length) {
    const c = s[i]!;
    if (/\s/.test(c)) { i++; continue; }
    if (c === "[" && i + 1 < s.length && s[i + 1] === "]") {
      out.push({ kind: "SQBRACKETS", value: "[]", pos: i }); i += 2; continue;
    }
    if (c === "{") { out.push({ kind: "LBRACE", value: c, pos: i }); i++; continue; }
    if (c === "}") { out.push({ kind: "RBRACE", value: c, pos: i }); i++; continue; }
    if (c === ":") { out.push({ kind: "COLON", value: c, pos: i }); i++; continue; }
    if (c === ";") { out.push({ kind: "SEMI", value: c, pos: i }); i++; continue; }
    if (c === "?") { out.push({ kind: "Q", value: c, pos: i }); i++; continue; }
    if (c === ",") { out.push({ kind: "COMMA", value: c, pos: i }); i++; continue; }
    if (c === "<") { out.push({ kind: "LT", value: c, pos: i }); i++; continue; }
    if (c === ">") { out.push({ kind: "GT", value: c, pos: i }); i++; continue; }

    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j]!)) j++;
      const word = s.slice(i, j);
      const kind: TokKind = KWDS.has(word) ? "KW" : "IDENT";
      out.push({ kind, value: word, pos: i });
      i = j; continue;
    }else{
    // catch-all: consume until whitespace or a stop char
    const STOP = new Set(["{","}","[","]",":",";",",","<",">","?"]);
    let j = i;
    while (
      j < s.length &&
      !(s[j] === "[" && s[j+1] === "]") && // stop before []
      !STOP.has(s[j]!)
    ) {
      j++;
    }
    if (j === i) j++; // safety: always consume at least one char
    const text = s.slice(i, j);
    out.push({ kind: "UNKNOWN", value: text, pos: i });
    i = j;
    continue;
  }


    throw new SyntaxError(`Unexpected character ${JSON.stringify(c)} at ${i}`);
  }
  return out;
}

// ---------------- Parser ----------------

class Parser {
  private toks: Tok[];
  private i = 0;
  private src: string;

  constructor(tokens: Tok[], src = "") {
    this.toks = tokens; this.src = src;
  }

  private peek(k = 0): Tok | null {
    const j = this.i + k;
    return 0 <= j && j < this.toks.length ? this.toks[j]! : null;
  }

  private want(kind: TokKind): Tok {
    const t = this.peek();
    if (!t || t.kind !== kind) {
      const got = t ? t.kind : "EOF";
      const pos = t ? t.pos : "EOF";
      console.log(this.src)
      throw new SyntaxError(`Expected ${kind}, got ${got} at pos ${pos}`);
    }
    this.i++;
    return t;
  }

  private accept(kind: TokKind): Tok | null {
    const t = this.peek();
    if (t && t.kind === kind) { this.i++; return t; }
    return null;
  }

  // Schema := Object
  parse_schema(): Obj { return this.parse_object(); }

  // Object := '{' ( Field (';' Field)* )? '}' (trailing ';' allowed)
  private parse_object(): Obj {
    this.want("LBRACE");
    const fields: Field[] = [];
    while (this.peek() && this.peek()!.kind !== "RBRACE") {
      fields.push(this.parse_field());
      this.accept("SEMI");
      if (this.accept("SEMI") || this.accept("COMMA")) {
        while (this.accept("SEMI") || this.accept("COMMA")) { /* swallow extras */ }
      }
    }
    this.want("RBRACE");
    return { node: "Obj", fields };
  }

  // Field := Ident Opt? ':' Type
  private parse_field(): Field {
    const name_tok = this.want("IDENT");
    const optional = !!this.accept("Q");
    this.want("COLON");
    const typ = this.parse_type();
    return { name: name_tok.value, typ, optional };
  }

  // Type := Primary ('[]')*
  private parse_type(): TypeNode {
    let t = this.parse_primary();
    while (this.accept("SQBRACKETS")) {
      t = { node: "Array", item: t };
    }
    return t;
  }

  // Parse the basic types or structures
  private parse_primary(): TypeNode {
    const t = this.peek();
    if (!t) throw new SyntaxError("Unexpected EOF while parsing Type");

    // Object or '{}'
    if (t.kind === "LBRACE") {
      if (this.peek(1) && this.peek(1)!.kind === "RBRACE") {
        this.want("LBRACE"); this.want("RBRACE");
        return { node: "Obj", fields: [] };
      }
      return this.parse_object();
    }

    // Record<string, T>
    if (t.kind === "IDENT" && t.value === "Record") {
      this.want("IDENT"); // Record
      this.want("LT");    // <
      const k = this.want("KW"); // expect 'string'
      if (k.value !== "string")
        throw new SyntaxError(`Only Record<string, ...> supported at pos ${k.pos}`);
      this.want("COMMA");
      const val = this.parse_type();
      this.want("GT");
      return { node: "MappingType", value: val };
    }

    // Base keywords
    if (t.kind === "KW") {
      const v = this.want("KW").value;
      return { node: "Base", kind: v };
    }

    if (t.kind === "IDENT") {
      const name = this.want("IDENT").value;
      return { node: "Base", kind: name };
    }

    if (t.kind === "UNKNOWN") {
      this.want("UNKNOWN");
      return { node: "Unknown" };
    }

    console.log(this.src)
    throw new SyntaxError(`Unexpected token ${JSON.stringify(t)} in Primary`);
  }
}

export function parse_schema(src: string): Obj {
  const toks = tokenize(src);
  console.log("===Tokens=====\n", toks)
  const p = new Parser(toks, src);
  const root = p.parse_schema();
  if (p["peek"]() !== null) {
    const t = (p as any)["peek"]();
    throw new SyntaxError(`Unexpected trailing tokens at pos ${t && t.pos}`);
  }
  return root;
}

// ---------------- Shape signatures & naming ----------------

const PYTHON_KEYWORDS = new Set([
  "False","None","True","and","as","assert","async","await","break","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","nonlocal","not","or","pass","raise","return","try","while","with","yield"
]);

export function valid_identifier(name: string): boolean {
  return /^[A-Za-z_]\w*$/.test(name) && !PYTHON_KEYWORDS.has(name);
}

// Signature is a JSON-serializable structure so we can stringify for Map keys
export type Sig =
  | ["base", string]
  | ["array", Sig]
  | ["obj", ReadonlyArray<[string, boolean, Sig]>]
  | ["mapping", Sig]
  | ["unknoen"];

export function type_signature(t: TypeNode): Sig {
  if (t.node === "Base") return ["base", t.kind];
  if (t.node === "Array") return ["array", type_signature(t.item)];
  if (t.node === "Obj") {
    const items = [...t.fields]
      .map(f => [f.name, f.optional, type_signature(f.typ)] as [string, boolean, Sig])
      .sort((a, b) => a[0].localeCompare(b[0]));
    return ["obj", items];
  }
  if (t.node === "MappingType") return ["mapping", type_signature(t.value)];
  if(t.node == "Unknown") return ["unknoen"]
  throw new TypeError(`Unknown TypeNode: ${(t as any) && (t as any).node}`);
}

export interface TDClass {
  name: string;
  fields: ReadonlyArray<Field>;
}

class Registry {
  private sig_to_name = new Map<string, string>();
  defined = new Map<string, TDClass>();
  private used_names = new Set<string>();

  private key(sig: Sig): string { return JSON.stringify(sig); }

  uniquify(base: string): string {
    if (!this.used_names.has(base)) { this.used_names.add(base); return base; }
    let k = 2;
    while (this.used_names.has(`${base}${k}`)) k++;
    const name = `${base}${k}`; this.used_names.add(name); return name;
  }

  name_for_obj(obj: Obj, path_hint: string[]): string {
    const sig = type_signature(obj);
    const K = this.key(sig);
    const found = this.sig_to_name.get(K);
    if (found) return found;
    // let raw = path_hint.filter(Boolean).map(seg => seg.slice(0,1).toUpperCase() + seg.slice(1)).join("");
    let raw = path_hint.filter(Boolean).join("_");

    if (!raw) raw = "Root";
    if (!valid_identifier(raw)) raw = "Type";
    const name = this.uniquify(raw);
    this.sig_to_name.set(K, name);
    return name;
    // if (!raw) raw = "Root";
    // if (!valid_identifier(raw)) raw = "Type";
    // const name = this.uniquify(raw);
    // this.sig_to_name.set(K, name);
    // return name;
  }
}

export function collect_objects(root: Obj, root_hint = "Root"): TDClass[] {
  const reg = new Registry();
  const out: TDClass[] = [];
  const seen = new Set<string>();

  const visit = (t: TypeNode, path: string[]): string | null => {
    if (t.node === "Obj") {
      if (t.fields.length === 0) return null; // '{}' → Mapping[str, object], no class
      const name = reg.name_for_obj(t, path);
      if (seen.has(name)) return name;
      // Visit children first
      for (const f of t.fields) visit(f.typ, path.concat([f.name]));
      seen.add(name);
      reg.defined.set(name, { name, fields: t.fields });
      out.push({ name, fields: t.fields });
      return name;
    } else if (t.node === "Array") {
      // ensure visiting item type
      visit(t.item, path); return null;
    } else if (t.node === "MappingType") {
      visit(t.value, path); return null;
    } else {
      return null;
    }
  };

  visit(root, [root_hint]);
  return out;
}

// ---------------- Type mapping for codegen ----------------

export function py_type(t: TypeNode, name_of: Map<string, string>): string {
  if (t.node === "Base") {
    if (t.kind === "string") return "str";
    if (t.kind === "number") return "int";
    if (t.kind === "int") return "int";
    if (t.kind === "boolean") return "bool";
    if (t.kind === "emptyobj") return "Mapping[str, object]"; // (unused here)
    return "Any";

    // throw new Error(`Unknown base ${t.kind}`);
  }
  if (t.node === "Array") {
    const inner = py_type(t.item, name_of);
    return `list[${inner}]`;
  }
  if (t.node === "Obj") {
    if (t.fields.length === 0) return "Mapping[str, object]";
    const sig = type_signature(t);
    const key = JSON.stringify(sig);
    const name = name_of.get(key);
    if (!name) throw new Error("Unresolved object name for signature");
    return name;
  }
  if (t.node === "MappingType") {
    const inner = py_type(t.value, name_of);
    return `Mapping[str, ${inner}]`;
  }

  if (t.node === "Unknown") {
    return "Any";
  }

  throw new TypeError(`Unknown TypeNode ${(t as any).node}`);
}

// ---------------- Codegen ----------------

export function render_typeddicts(root: Obj, rootName: string = "Root"): string {
  const root_name = rootName ?? "Root";
  const classes = collect_objects(root, root_name);

  // map signatures to names for type resolution
  const name_of = new Map<string, string>();
  for (const cls of classes) {
    const sig = type_signature({ node: "Obj", fields: cls.fields });
    name_of.set(JSON.stringify(sig), cls.name);
  }

  const needed = new Set<string>(["TypedDict"]);
  const lines: string[] = [];

  const field_type_str = (t: TypeNode): string => {
    const s = py_type(t, name_of);
    if (s.includes("Mapping[")) needed.add("Mapping");
    // list[...] needs no extra import in Python 3.9+
    return s;
  };

  const opt_wrap = (s: string, optional: boolean): string => {
    if (optional) { needed.add("NotRequired"); return `NotRequired[${s}]`; }
    return s;
  };

  for (const cls of classes) {
    const all_valid = cls.fields.every(f => valid_identifier(f.name));
    if (all_valid) {
      lines.push(`class ${cls.name}(TypedDict):`);
      if (!cls.fields.length) {
        lines.push("    pass");
      } else {
        for (const f of cls.fields) {
          const t_str = opt_wrap(field_type_str(f.typ), f.optional);
          lines.push(`    ${f.name}: ${t_str}`);
        }
      }
    } else {
      lines.push(`${cls.name} = TypedDict("${cls.name}", {`);
      cls.fields.forEach((f, idx) => {
        const t_str = opt_wrap(field_type_str(f.typ), f.optional);
        const comma = idx < cls.fields.length - 1 ? "," : "";
        lines.push(`    ${JSON.stringify(f.name)}: ${t_str}${comma}`);
      });
      lines.push("})");
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function schema_to_typeddicts_code(src: string, rootName: string = 'Root'): string {
  const root = parse_schema(src);
  return render_typeddicts(root, rootName);
}

// -------------- Convenience constructors (mirroring Python dataclass init) --------------
export const BaseT = (kind: string): Base => ({ node: "Base", kind });
export const ArrayOf = (item: TypeNode): ArrayT => ({ node: "Array", item });
export const MappingOf = (value: TypeNode): MappingType => ({ node: "MappingType", value });
export const ObjOf = (fields: ReadonlyArray<Field>): Obj => ({ node: "Obj", fields });

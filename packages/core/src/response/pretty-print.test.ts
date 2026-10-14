import { describe, expect, it } from "vitest";

import { formatJsonText, formatXmlText, prettyPrintBody } from "./pretty-print";

describe("formatJsonText", () => {
  it("indents objects and arrays two spaces per level", () => {
    expect(formatJsonText('{"a":1,"b":[true,null],"c":{}}')).toBe(
      ["{", '  "a": 1,', '  "b": [', "    true,", "    null", "  ],", '  "c": {}', "}"].join("\n"),
    );
  });

  it("matches JSON.stringify on ordinary documents", () => {
    const value = {
      users: [
        { id: 1, name: "Ada", tags: [] },
        { id: 2, meta: { active: false } },
      ],
    };
    expect(formatJsonText(JSON.stringify(value))).toBe(JSON.stringify(value, null, 2));
  });

  it("keeps numbers, key order and duplicate keys exactly as received", () => {
    expect(formatJsonText('{"id":12345678901234567890,"z":1.10,"z":2}')).toBe(
      '{\n  "id": 12345678901234567890,\n  "z": 1.10,\n  "z": 2\n}',
    );
  });

  it("leaves strings alone, escaped quotes and structural characters included", () => {
    expect(formatJsonText(String.raw`{"text":"a \"quoted\" {value}, [x]: y\\"}`)).toBe(
      String.raw`{
  "text": "a \"quoted\" {value}, [x]: y\\"
}`,
    );
  });

  it("re-spaces bodies that are already formatted", () => {
    expect(formatJsonText('{\r\n\t"a" :  [ 1 ,2 ]\r\n}')).toBe(
      '{\n  "a": [\n    1,\n    2\n  ]\n}',
    );
  });

  it("never throws on text that is not JSON", () => {
    expect(formatJsonText('{"open": "never closed')).toBe('{\n  "open": "never closed');
    expect(formatJsonText("]]")).toBe("\n]\n]");
    expect(formatJsonText("")).toBe("");
  });
});

describe("formatXmlText", () => {
  it("puts each element on its own line and keeps text-only elements together", () => {
    expect(formatXmlText('<?xml version="1.0"?><a><b>text</b><c/><d></d></a>')).toBe(
      ['<?xml version="1.0"?>', "<a>", "  <b>text</b>", "  <c/>", "  <d></d>", "</a>"].join("\n"),
    );
  });

  it("keeps comments, CDATA and quoted '>' in attributes whole", () => {
    expect(formatXmlText('<a title="x > y"><!-- <b> --><![CDATA[<c>]]></a>')).toBe(
      ['<a title="x > y">', "  <!-- <b> -->", "  <![CDATA[<c>]]>", "</a>"].join("\n"),
    );
  });

  it("keeps a doctype with an internal subset on one line", () => {
    expect(formatXmlText('<!DOCTYPE a [<!ENTITY e "v">]><a/>')).toBe(
      '<!DOCTYPE a [<!ENTITY e "v">]>\n<a/>',
    );
  });

  it("indents mixed content", () => {
    expect(formatXmlText("<p>Hello <b>world</b> again</p>")).toBe(
      ["<p>", "  Hello", "  <b>world</b>", "  again", "</p>"].join("\n"),
    );
  });
});

describe("prettyPrintBody", () => {
  it("formats JSON and XML, and leaves other formats as received", () => {
    expect(prettyPrintBody("json", "[1]")).toBe("[\n  1\n]");
    expect(prettyPrintBody("xml", "<a><b/></a>")).toBe("<a>\n  <b/>\n</a>");
    expect(prettyPrintBody("html", "<p>x</p>")).toBeNull();
    expect(prettyPrintBody("text", "x")).toBeNull();
  });
});

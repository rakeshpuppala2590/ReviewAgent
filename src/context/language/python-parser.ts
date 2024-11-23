import { AbstractParser, EnclosingContext } from "../../constants";
import * as pythonAst from "python-ast";
const processPythonNode = (
  node: any,
  lineStart: number,
  lineEnd: number,
  largestSize: number,
  largestEnclosingContext: any
) => {
  const { lineno, end_lineno } = node;
  if (lineno <= lineStart && lineEnd <= end_lineno) {
    const size = end_lineno - lineno;
    if (size > largestSize) {
      largestSize = size;
      largestEnclosingContext = node;
    }
  }
  return { largestSize, largestEnclosingContext };
};

export class PythonParser implements AbstractParser {
  findEnclosingContext(
    file: string,
    lineStart: number,
    lineEnd: number
  ): EnclosingContext {
    const ast = pythonAst.parse(file);

    let largestEnclosingContext: any = null;
    let largestSize = 0;
    console.log("Testing Python Parser");
    const traverseNode = (node: any) => {
      if (!node || typeof node !== "object") return;

      ({ largestSize, largestEnclosingContext } = processPythonNode(
        node,
        lineStart,
        lineEnd,
        largestSize,
        largestEnclosingContext
      ));

      const childKeys = Object.keys(node).filter(
        (key) => Array.isArray(node[key]) || typeof node[key] === "object"
      );
      childKeys.forEach((key) => {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(traverseNode);
        } else {
          traverseNode(child);
        }
      });
    };

    traverseNode(ast);
    return {
      enclosingContext: largestEnclosingContext,
    } as EnclosingContext;
  }

  dryRun(file: string): { valid: boolean; error: string } {
    try {
      pythonAst.parse(file);
      return {
        valid: true,
        error: "",
      };
    } catch (exc) {
      return {
        valid: false,
        error: exc.message,
      };
    }
  }
}

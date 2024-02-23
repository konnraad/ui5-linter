import anyTest, {TestFn} from "ava";
import sinonGlobal from "sinon";
import path from "node:path";
// import fs from "node:fs/promises";
import {fileURLToPath} from "node:url";
// import {amdToEsm} from "../../../../../src/detectors/transpilers/amd/transpiler.js";
import {createTestsForFixtures} from "./_helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, "..", "..", "..", "..", "fixtures", "transpiler", "amd");

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox,
	createdFiles: object,
}>;

test.beforeEach(async (t) => {
	t.context.sinon = sinonGlobal.createSandbox();
	t.context.createdFiles = {};
});
test.afterEach.always((t) => {
	t.context.sinon.restore();
});

createTestsForFixtures(fixtures);

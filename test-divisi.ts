import prisma from "./src/lib/prisma";

async function test() {
  try {
    await prisma.divisi.create({ data: { name: "Test Divisi", description: "" } });
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
test();

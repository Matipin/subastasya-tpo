async function test() {
  try {
    const response = await fetch('https://subastasya-tpo.onrender.com/api/v1/auctions', { timeout: 10000 });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error fetching:", e.message);
  }
}

test();

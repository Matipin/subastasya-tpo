async function checkApis() {
    try {
        const renderRes = await fetch("https://subastasya-tpo.onrender.com/api/v1/auctions");
        const data = await renderRes.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Render failed:", e.message);
    }
}
checkApis();

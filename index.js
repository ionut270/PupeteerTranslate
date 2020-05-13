const express = require("express"),
	cors = require("cors"),
	puppeteer = require("puppeteer"),
	app = express();

app.use(cors());
app.listen(8003, () => console.log(`App listening at http://localhost:${8003}`));

const preparePageForTests = async (page) => {
	// Pass the User-Agent Test.
	const userAgent = "Mozilla/5.0 (X11; Linux x86_64)" + "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36";
	await page.setUserAgent(userAgent);
};

app.get("/translate", async (req, res) => {

    let start = Date.now();

	let value = req.headers.value;

	const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
	await preparePageForTests(page);
	await page.goto("https://translate.google.ro/");
	await page.evaluate(
		({ value }) => {
			document.getElementsByClassName("orig tlid-source-text-input goog-textarea")[0].value = value;
		},
		{ value },
	);

	const waitForResponse = (page, url) => {
		return new Promise((resolve) => {
			page.on("response", function callback(response) {
				if (response.url() === url) {
					resolve(response);
					page.removeListener("response", callback);
				}
			});
		});
	};
	await waitForResponse(page, "https://ssl.gstatic.com/images/icons/material/system_gm/1x/verified_user_black_24dp.png");

	let data = await page.evaluate(() => {
		let data2 = document.getElementsByClassName("tlid-translation translation")[0].innerText;
		return data2;
	});

	res.status(200).send({ translated: data, duration : Date.now() - start });
	await browser.close();
});

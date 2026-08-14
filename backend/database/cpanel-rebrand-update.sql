-- The Tailors Market rebrand (run on existing production DB)
UPDATE `settings` SET `value` = 'The Tailors Market' WHERE `key` = 'site_name';
UPDATE `settings` SET `value` = 'Everything tailors need — fabrics, tools, patterns, and supplies from trusted vendors.' WHERE `key` = 'site_description';
UPDATE `settings` SET `value` = 'info@thetailorsmarket.com' WHERE `key` = 'contact_email';

UPDATE `users` SET `email` = 'admin@thetailorsmarket.com' WHERE `email` = 'admin@monogramsmarket.com';

UPDATE `shops`
SET `name` = 'The Tailors Market',
    `slug` = 'the-tailors-market',
    `bio` = 'Official The Tailors Market shop.'
WHERE `slug` = 'monograms-market' OR `name` = 'Monograms Market';

UPDATE `pages` SET `content` = '<h2>For buyers</h2><p>Browse tailoring materials and digital patterns, choose digital, physical, or both where offered, pay securely, then download files instantly or receive shipped items.</p><h2>For vendors</h2><p>Open a shop, list your supplies, and keep 90% of product sales plus shipping on your items.</p>' WHERE `slug` = 'how-it-works';
UPDATE `pages` SET `content` = '<h3>What can I buy?</h3><p>Fabrics, threads, tools, machines, trims, and digital patterns — whatever tailors need.</p><h3>Digital vs physical</h3><p>Digital products are downloaded after payment. Physical products are packed and shipped. Some listings offer both.</p>' WHERE `slug` = 'faqs';
UPDATE `pages` SET `content` = '<p>By using The Tailors Market you agree to our terms.</p>' WHERE `slug` = 'terms';
UPDATE `pages` SET `content` = '<p>We respect your privacy and protect your data.</p>' WHERE `slug` = 'privacy';
UPDATE `pages` SET `content` = '<p>Digital pattern and file purchases include commercial use for your own production. Do not resell or redistribute the original digital files.</p>' WHERE `slug` = 'licensing';

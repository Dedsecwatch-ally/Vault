require('dotenv').config();
const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Required for Supabase/MinIO
});

(async () => {
    try {
        console.log('Testing S3 connection...');
        console.log(`Endpoint: ${process.env.AWS_ENDPOINT}`);
        console.log(`Region: ${process.env.AWS_REGION}`);
        console.log(`Bucket: ${process.env.AWS_S3_BUCKET}`);

        // List buckets
        console.log('\nListing buckets...');
        const data = await client.send(new ListBucketsCommand({}));
        console.log('Success! Buckets found:');
        data.Buckets.forEach(b => console.log(` - ${b.Name}`));

        // Try to upload a small file
        console.log('\nAttempting to upload a test file...');
        await client.send(new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: 'test-connectivity.txt',
            Body: 'Hello from test script!',
        }));
        console.log('Upload successful!');

    } catch (err) {
        console.error('\n❌ Error:', err);
    }
})();

const {
    S3Client
  } =
    require('@aws-sdk/client-s3');
  
  let s3Client;
  
  /**
   * Returns the configured private S3 media storage.
   *
   * AWS credentials are loaded through the normal
   * AWS credential chain. During local development,
   * AWS_PROFILE identifies the configured CLI profile.
   */
  function getMediaStorage() {
    const region =
      process.env.AWS_REGION;
  
    const bucket =
      process.env.AWS_S3_MEDIA_BUCKET;
  
    if (!region) {
      throw new Error(
        'AWS_REGION is not configured.'
      );
    }
  
    if (!bucket) {
      throw new Error(
        'AWS_S3_MEDIA_BUCKET is not configured.'
      );
    }
  
    if (!s3Client) {
      s3Client =
        new S3Client({
          region
        });
    }
  
    return {
      client:
        s3Client,
  
      bucket,
  
      region
    };
  }
  
  module.exports = {
    getMediaStorage
  };
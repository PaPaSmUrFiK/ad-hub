package com.bsuir.adhubbackand.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    @Value("${minio.url}")
    private String minioUrl;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket.avatars}")
    private String avatarsBucketName;

    @Value("${minio.bucket.ads-media}")
    private String adsMediaBucketName;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(accessKey, secretKey)
                .build();
    }

    @Bean(name = "avatarsBucketName")
    public String avatarsBucketName() {
        return avatarsBucketName;
    }

    @Bean(name = "adsMediaBucketName")
    public String adsMediaBucketName() {
        return adsMediaBucketName;
    }
}
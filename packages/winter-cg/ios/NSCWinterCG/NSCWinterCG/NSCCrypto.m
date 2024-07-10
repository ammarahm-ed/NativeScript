//
//  NSCCrypto.m
//  NSCWinterCG
//
//  Created by Osei Fortune on 03/07/2024.
//  Copyright © 2024 NativeScript. All rights reserved.
//

#import "NSCCrypto.h"

@implementation NSCCryptoKeyPair

- (void)dealloc
{
    if(self.privateKey != NULL){
        CFRelease(self.privateKey);
    }
    if(self.publicKey != NULL){
        CFRelease(self.publicKey);
    }
}
- (nonnull id)initWithPrivateKey:(nonnull SecKeyRef)privKey andPublicKey:(nonnull SecKeyRef)pubKey {
    self = [super init];
    if(self){
        self.privateKey = privKey;
        self.publicKey = pubKey;
    }
    return self;
}

@end


@implementation NSCCrypto

+ (NSString *)randomUUID {
    return [[[NSUUID UUID] UUIDString] lowercaseString];
}

+ (NSString *)getRandomValues:(nonnull void *)buffer length:(unsigned int)length {
    if(buffer != nil){
        int result = SecRandomCopyBytes(kSecRandomDefault, length, buffer);
        if(result != errSecSuccess){
            return @"Failed to generate random values";
        }else {
            return nil;
        }
    }
    
    return @"Failed to generate random values";
}

+ (nullable NSData *)digest:(nonnull void *)data length:(unsigned int)length mode:(int)mode {
    switch (mode) {
        case 0:
        {
            NSData* hash = [NSMutableData dataWithLength:CC_SHA1_DIGEST_LENGTH];
            CC_SHA1(data, length, (unsigned char *)hash.bytes);
            return hash;
        }
            break;
            
        case 1:
        {
            NSData* hash = [NSMutableData dataWithLength:CC_SHA256_DIGEST_LENGTH];
            CC_SHA256(data, length, (unsigned char *)hash.bytes);
            return hash;
        }
            
            
        case 2:
        {
            NSData* hash = [NSMutableData dataWithLength:CC_SHA384_DIGEST_LENGTH];
            CC_SHA384(data, length, (unsigned char *)hash.bytes);
            return hash;
        }
            
        case 3:
        {
            NSData* hash = [NSMutableData dataWithLength:CC_SHA512_DIGEST_LENGTH];
            CC_SHA512(data, length, (unsigned char *)hash.bytes);
            return hash;
        }
            
        default:
            return nil;
    }
}


+ (nullable NSData *)generateKeyHmac:(int)hash length:(int)length  {
    NSMutableData* ret = nil;
    switch (hash) {
        case 0:
        {
            unsigned int len = length > 0 ? length / 8 : CC_SHA1_DIGEST_LENGTH;
            NSMutableData* data = [NSMutableData dataWithLength: len];
              int result = SecRandomCopyBytes(kSecRandomDefault, len, data.mutableBytes);
              if (result == errSecSuccess) {
                  ret = data;
              }
          
        }
            break;
            
        case 1:
        {
            unsigned int len = length > 0 ? length / 8 : CC_SHA256_DIGEST_LENGTH;
            NSMutableData* data = [NSMutableData dataWithLength: len];
              int result = SecRandomCopyBytes(kSecRandomDefault, len, data.mutableBytes);
              if (result == errSecSuccess) {
                  ret = data;
              }
        }
            
            
        case 2:
        {
            unsigned int len = length > 0 ? length / 8 : CC_SHA384_DIGEST_LENGTH;
            NSMutableData* data = [NSMutableData dataWithLength: len];
              int result = SecRandomCopyBytes(kSecRandomDefault, len, data.mutableBytes);
              if (result == errSecSuccess) {
                  ret = data;
              }
        }
            
        case 3:
        {
            unsigned int len = length > 0 ? length / 8 : CC_SHA512_DIGEST_LENGTH;
            NSMutableData* data = [NSMutableData dataWithLength: len];
              int result = SecRandomCopyBytes(kSecRandomDefault, len, data.mutableBytes);
              if (result == errSecSuccess) {
                  ret = data;
              }
        }
            
        default:
            // noop
            break;
    }
    return ret;
}

+ (BOOL)verifyHmac:(nonnull NSData *)key hash:(NSCCryptoHash)hash signature:(nonnull NSData *)signature data:(nonnull NSData *)data {
    switch (hash) {
        case kNSCCryptoHashSHA1:
        {
            return [[NSCCrypto signHmac:key hash:hash data:data] isEqualToData:signature];
        }
        case kNSCCryptoHashSHA256:
        {
              return [[NSCCrypto signHmac:key hash:hash data:data] isEqualToData:signature];
        }
        case kNSCCryptoHashSHA384:
        {
              return [[NSCCrypto signHmac:key hash:hash data:data] isEqualToData:signature];
        }
        case kNSCCryptoHashSHA512:
        {
              return [[NSCCrypto signHmac:key hash:hash data:data] isEqualToData:signature];
        }
        default:
            return false;;
    }
}


+ (nullable NSData *)signHmac:(nonnull NSData *)key hash:(NSCCryptoHash)hash data:(nonnull NSData *)data {
    NSMutableData* ret = nil;
    switch (hash) {
        case kNSCCryptoHashSHA1:
        {
            ret = [NSMutableData dataWithLength:CC_SHA1_DIGEST_LENGTH];
            CCHmac(kCCHmacAlgSHA1, key.bytes, key.length, data.bytes, data.length, ret.mutableBytes);
        }
            break;
        case kNSCCryptoHashSHA256:
        {
            ret = [NSMutableData dataWithLength:CC_SHA256_DIGEST_LENGTH];
            CCHmac(kCCHmacAlgSHA256, key.bytes, key.length, data.bytes, data.length, ret.mutableBytes);
        }
            break;
        case kNSCCryptoHashSHA384:
        {
            ret = [NSMutableData dataWithLength:CC_SHA384_DIGEST_LENGTH];
            CCHmac(kCCHmacAlgSHA384, key.bytes, key.length, data.bytes, data.length, ret.mutableBytes);
        }
            break;
        case kNSCCryptoHashSHA512:
        {
            ret = [NSMutableData dataWithLength:CC_SHA512_DIGEST_LENGTH];
            CCHmac(kCCHmacAlgSHA512, key.bytes, key.length, data.bytes, data.length, ret.mutableBytes);
        }
            break;
        default:
            break;
    }
    return ret;
}




+ (nullable NSCCryptoKeyPair *)generateKeyRsa:(NSCCryptoRsaHashedKeyGenParamsName)name modulusLength:(unsigned int)modulusLength publicExponent:(nullable void *)exponent size:(unsigned int)size hash:(NSCCryptoHash)hash extractable:(BOOL)extractable keyUsages:(nonnull NSArray *)usages{
    
    NSData* exp;
    
    if(exponent != NULL){
        // todo
        exp = [NSData dataWithBytesNoCopy:exponent length:size];
    }
    
    
    CFMutableDictionaryRef privateKeyAttrs = CFDictionaryCreateMutable(NULL, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
    CFMutableDictionaryRef publicKeyAttrs = CFDictionaryCreateMutable(NULL, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
    CFMutableDictionaryRef keyPairAttrs = CFDictionaryCreateMutable(NULL, 0, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
    
    
    CFDictionarySetValue(keyPairAttrs, kSecAttrKeyType, kSecAttrKeyTypeRSA);
    
    CFDictionarySetValue(keyPairAttrs, kSecAttrKeySizeInBits, (__bridge CFNumberRef)@(modulusLength));
    //CFDictionarySetValue(keyPairAttrs, kSecAttrEffectiveKeySize, (__bridge CFNumberRef)@(modulusLength));
    
    
    
    CFDictionarySetValue(keyPairAttrs, kSecPrivateKeyAttrs, privateKeyAttrs);
    CFDictionarySetValue(keyPairAttrs, kSecPublicKeyAttrs, publicKeyAttrs);
    
    
    if(usages != NULL){
        for (NSUInteger i = 0; i < [usages count]; i++) {
            NSCCryptoKeyUsages usage = (NSCCryptoKeyUsages)usages[i];
            switch (usage) {
                case kNSCCryptoEncrypt:
                    CFDictionarySetValue(keyPairAttrs, kSecAttrCanEncrypt, kCFBooleanTrue);
                    break;
                case kNSCCryptoDecrypt:
                    CFDictionarySetValue(keyPairAttrs, kSecAttrCanDecrypt, kCFBooleanTrue);
                    break;
                case kNSCCryptoSign:
                    CFDictionarySetValue(keyPairAttrs, kSecAttrCanSign, kCFBooleanTrue);
                    break;
                case kNSCCryptoVerify:
                    CFDictionarySetValue(keyPairAttrs, kSecAttrCanVerify, kCFBooleanTrue);
                    break;
                case kNSCCryptoDeriveKey:
                    CFDictionarySetValue(keyPairAttrs, kSecAttrCanDerive, kCFBooleanTrue);
                    break;
                case kNSCCryptoWrapKey:
                    CFDictionarySetValue(keyPairAttrs, kSecAttrCanWrap, kCFBooleanTrue);
                    break;
                case kNSCCryptoUnwrapKey:
                    CFDictionarySetValue(keyPairAttrs, kSecAttrCanUnwrap, kCFBooleanTrue);
                    break;
                default:
                    // NOOP
                    break;
            }
        }
    }
        
        
        SecKeyRef publicKey = NULL;
        SecKeyRef privateKey = NULL;
        OSStatus status = SecKeyGeneratePair(keyPairAttrs, &publicKey, &privateKey);
        
        CFRelease(privateKeyAttrs);
        CFRelease(publicKeyAttrs);
        CFRelease(keyPairAttrs);
        
        if (status == errSecSuccess) {
            NSCCryptoKeyPair* pair = [[NSCCryptoKeyPair alloc] initWithPrivateKey:privateKey andPublicKey: publicKey];
            return pair;
        } else {
            if (publicKey) CFRelease(publicKey);
            if (privateKey) CFRelease(privateKey);
            return NULL;
        }
}

+ (nullable NSData *)encryptRsa:(BOOL)isPrivate key:(nonnull NSCCryptoKeyPair *)key hash:(NSCCryptoHash)hash data:(nonnull void*)data size:(unsigned int) size {
    NSData* toEncrypt = [NSData dataWithBytesNoCopy:data length:size];
    NSData *cipherText = nil;
    CFErrorRef error = NULL;
    if(isPrivate){
       
        
        switch (hash) {
            case kNSCCryptoHashSHA1:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA1;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateEncryptedData(key.privateKey, algorithm, (__bridge CFDataRef)toEncrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA256:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA256;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateEncryptedData(key.privateKey, algorithm, (__bridge CFDataRef)toEncrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA384:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA384;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateEncryptedData(key.privateKey, algorithm, (__bridge CFDataRef)toEncrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA512:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA512;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateEncryptedData(key.privateKey, algorithm, (__bridge CFDataRef)toEncrypt, &error));
            }
                break;
            default:
                break;
        }
        
          
    }else {
        switch (hash) {
            case kNSCCryptoHashSHA1:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA1;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateEncryptedData(key.publicKey, algorithm, (__bridge CFDataRef)toEncrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA256:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA256;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateEncryptedData(key.publicKey, algorithm, (__bridge CFDataRef)toEncrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA384:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA384;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateEncryptedData(key.publicKey, algorithm, (__bridge CFDataRef)toEncrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA512:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA512;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateEncryptedData(key.publicKey, algorithm, (__bridge CFDataRef)toEncrypt, &error));
            }
                break;
            default:
                break;
        }
    }
    
    if (!cipherText) {
            NSLog(@"Failed to encrypt message: %@", error);
            CFRelease(error);
        }
    
    return cipherText;
}


+ (nullable NSData *)decryptRsa:(BOOL)isPrivate key:(nonnull NSCCryptoKeyPair *)key hash:(NSCCryptoHash)hash data:(nonnull void*)data size:(unsigned int) size {
    NSData* toDecrypt = [NSData dataWithBytesNoCopy:data length:size];
    NSData *cipherText = nil;
    CFErrorRef error = NULL;
    if(isPrivate){
       
        
        switch (hash) {
            case kNSCCryptoHashSHA1:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA1;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateDecryptedData(key.privateKey, algorithm, (__bridge CFDataRef)toDecrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA256:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA256;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateDecryptedData(key.privateKey, algorithm, (__bridge CFDataRef)toDecrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA384:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA384;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateDecryptedData(key.privateKey, algorithm, (__bridge CFDataRef)toDecrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA512:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA512;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateDecryptedData(key.privateKey, algorithm, (__bridge CFDataRef)toDecrypt, &error));
            }
                break;
            default:
                break;
        }
        
          
    }else {
        switch (hash) {
            case kNSCCryptoHashSHA1:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA1;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateDecryptedData(key.publicKey, algorithm, (__bridge CFDataRef)toDecrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA256:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA256;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateDecryptedData(key.publicKey, algorithm, (__bridge CFDataRef)toDecrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA384:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA384;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateDecryptedData(key.publicKey, algorithm, (__bridge CFDataRef)toDecrypt, &error));
            }
                break;
            case kNSCCryptoHashSHA512:
            {
                SecKeyAlgorithm algorithm = kSecKeyAlgorithmRSAEncryptionOAEPSHA512;

                cipherText = (NSData *)CFBridgingRelease(SecKeyCreateDecryptedData(key.publicKey, algorithm, (__bridge CFDataRef)toDecrypt, &error));
            }
                break;
            default:
                break;
        }
    }
    
    if (!cipherText) {
            NSLog(@"Failed to encrypt message: %@", error);
            CFRelease(error);
        }
    
    return cipherText;
}

@end

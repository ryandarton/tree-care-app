# API Documentation

## Base URL
- **Development**: `https://api-dev.treecare.app/v1`
- **Production**: `https://api.treecare.app/v1`

## Authentication

All API requests require authentication using JWT tokens obtained from AWS Cognito.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Error Responses
```json
{
  "error": "string",
  "message": "string", 
  "requestId": "string",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

## System Health

### Health Check
```http
GET /health
```

**Description:** Returns the current health status of the API service.

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "timestamp": "2025-07-01T23:30:00Z",
  "version": "1.0.0"
}
```

## User Management

### Get User Profile
```http
GET /users/profile
```

**Response:**
```json
{
  "userId": "user123",
  "email": "user@example.com",
  "subscriptionTier": "hobbyist",
  "location": {
    "coordinates": [40.7128, -74.0060],
    "climateZone": "6a",
    "city": "New York",
    "state": "NY"
  },
  "preferences": {
    "notifications": {
      "push": true,
      "sms": false,
      "email": true
    },
    "units": "imperial"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "lastActive": "2025-01-01T12:00:00Z"
}
```

### Update User Profile
```http
PUT /users/profile
```

**Request Body:**
```json
{
  "location": {
    "coordinates": [40.7128, -74.0060],
    "climateZone": "6a"
  },
  "preferences": {
    "notifications": {
      "push": true,
      "sms": true
    }
  }
}
```

## Tree Management

### Create New Tree
```http
POST /trees
```

**Request Body:**
```json
{
  "name": "Front Yard Oak",
  "species": {
    "scientificName": "Quercus rubra",
    "commonName": "Red Oak"
  },
  "plantedDate": "2020-03-15",
  "location": {
    "yardPosition": "front yard northeast corner",
    "coordinates": [40.7128, -74.0060],
    "sunExposure": "full sun",
    "soilType": "clay loam"
  },
  "shapeGoal": {
    "goalId": "high_canopy",
    "targetHeight": 40,
    "clearanceNeeded": 8
  },
  "currentStatus": {
    "height": 12,
    "trunkDiameter": 4,
    "healthScore": 85
  }
}
```

**Response:**
```json
{
  "treeId": "tree_abc123",
  "name": "Front Yard Oak",
  "species": {
    "scientificName": "Quercus rubra", 
    "commonName": "Red Oak",
    "speciesId": "species_456"
  },
  "shapeGoal": {
    "goalId": "high_canopy",
    "targetHeight": 40,
    "milestones": [
      {
        "year": 1,
        "title": "Establish Central Leader",
        "completed": true
      },
      {
        "year": 3,
        "title": "Begin Crown Lifting",
        "completed": false
      }
    ]
  },
  "createdAt": "2025-01-01T12:00:00Z"
}
```

### Get User's Trees
```http
GET /trees
```

**Query Parameters:**
- `limit` (optional): Number of trees to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (`active`, `archived`)

**Response:**
```json
{
  "trees": [
    {
      "treeId": "tree_abc123",
      "name": "Front Yard Oak",
      "species": {
        "commonName": "Red Oak",
        "scientificName": "Quercus rubra"
      },
      "currentStatus": {
        "height": 12,
        "age": 5,
        "healthScore": 85
      },
      "shapeGoal": {
        "goalId": "high_canopy",
        "progress": 40
      },
      "lastPhotoDate": "2024-12-15T14:30:00Z",
      "nextActionDue": "2025-02-15T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0
  }
}
```

### Get Tree Details
```http
GET /trees/{treeId}
```

**Response:**
```json
{
  "treeId": "tree_abc123",
  "name": "Front Yard Oak",
  "species": {
    "scientificName": "Quercus rubra",
    "commonName": "Red Oak",
    "characteristics": {
      "matureHeight": [50, 75],
      "growthRate": "moderate",
      "pruningBestSeason": ["late_winter", "early_spring"]
    }
  },
  "location": {
    "yardPosition": "front yard northeast corner",
    "coordinates": [40.7128, -74.0060],
    "sunExposure": "full sun"
  },
  "shapeGoal": {
    "goalId": "high_canopy",
    "selectedAt": "2024-01-15T10:30:00Z",
    "progress": 40,
    "milestones": [
      {
        "year": 1,
        "title": "Establish Central Leader",
        "tasks": ["Select strongest vertical shoot", "Remove competing leaders"],
        "completed": true,
        "completedAt": "2024-06-10T00:00:00Z"
      }
    ]
  },
  "careHistory": [
    {
      "date": "2024-12-15T14:30:00Z",
      "action": "pruning",
      "notes": "Removed crossing branches, thinned crown",
      "beforePhotoId": "photo_123",
      "afterPhotoId": "photo_124"
    }
  ]
}
```

### Update Tree
```http
PUT /trees/{treeId}
```

**Request Body:**
```json
{
  "name": "Updated Tree Name",
  "currentStatus": {
    "height": 14,
    "trunkDiameter": 5
  },
  "notes": "Growth update after winter pruning"
}
```

### Archive Tree
```http
DELETE /trees/{treeId}
```

## Photo Analysis

### Analyze Tree Photo
```http
POST /photos/analyze
```

**Request Body:**
```json
{
  "treeId": "tree_abc123",
  "photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "metadata": {
    "cameraAngle": "front",
    "timestamp": "2025-01-01T12:00:00Z",
    "gpsLocation": [40.7128, -74.0060],
    "weather": {
      "temperature": 45,
      "conditions": "partly cloudy"
    }
  }
}
```

**Response:**
```json
{
  "photoId": "photo_xyz789",
  "analysis": {
    "species": {
      "predicted": "Quercus rubra",
      "confidence": 0.92,
      "alternatives": [
        {"species": "Quercus velutina", "confidence": 0.08}
      ]
    },
    "structure": {
      "trunkDiameter": 4.2,
      "estimatedHeight": 13.5,
      "canopySpread": 11.8,
      "branchCount": {
        "primary": 4,
        "secondary": 12
      },
      "leaderDominance": 0.85
    },
    "health": {
      "overallScore": 87,
      "indicators": {
        "leafColor": "healthy",
        "leafDensity": "good", 
        "barkCondition": "normal",
        "structuralIssues": []
      },
      "diseases": [],
      "pests": []
    },
    "shapeProgress": {
      "goalId": "high_canopy",
      "currentProgress": 45,
      "milestonesAchieved": 2,
      "nextMilestone": "Begin Crown Lifting"
    }
  },
  "overlays": [
    {
      "type": "pruning_cut",
      "coordinates": [245, 180],
      "description": "Remove crossing branch",
      "priority": "medium",
      "technique": "thinning_cut"
    },
    {
      "type": "health_concern",
      "coordinates": [180, 220], 
      "description": "Monitor for scale insects",
      "priority": "low"
    }
  ],
  "processedImageUrl": "https://cdn.treecare.app/photos/processed/photo_xyz789.jpg"
}
```

### Get Photo History
```http
GET /trees/{treeId}/photos
```

**Query Parameters:**
- `limit` (optional): Number of photos to return (default: 20)
- `startDate` (optional): Filter photos from this date (ISO 8601)
- `endDate` (optional): Filter photos until this date (ISO 8601)

**Response:**
```json
{
  "photos": [
    {
      "photoId": "photo_xyz789",
      "timestamp": "2025-01-01T12:00:00Z",
      "thumbnailUrl": "https://cdn.treecare.app/photos/thumbs/photo_xyz789.jpg",
      "originalUrl": "https://cdn.treecare.app/photos/original/photo_xyz789.jpg",
      "analysis": {
        "healthScore": 87,
        "estimatedHeight": 13.5,
        "speciesConfidence": 0.92
      },
      "cameraAngle": "front"
    }
  ],
  "pagination": {
    "total": 15,
    "hasMore": true
  }
}
```

## Recommendations

### Get Tree Recommendations
```http
GET /recommendations/{treeId}
```

**Query Parameters:**
- `includeCompleted` (optional): Include completed recommendations (default: false)
- `priority` (optional): Filter by priority (`urgent`, `high`, `medium`, `low`)

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec_123",
      "type": "pruning",
      "priority": "high",
      "title": "Winter Pruning - Remove Crossing Branches",
      "description": "Remove branches that are crossing or rubbing against each other to prevent damage and improve air circulation.",
      "detailedInstructions": "1. Identify crossing branches in the lower canopy\n2. Select the better-positioned branch to keep\n3. Make clean cuts just outside the branch collar\n4. Apply pruning sealer if cuts are larger than 2 inches",
      "estimatedTime": 45,
      "difficulty": "intermediate",
      "tools": ["pruning saw", "loppers", "ladder"],
      "safety": ["Wear safety glasses", "Use proper ladder technique", "Never prune near power lines"],
      "timing": {
        "idealDate": "2025-02-15T00:00:00Z",
        "windowStart": "2025-02-01T00:00:00Z", 
        "windowEnd": "2025-03-15T00:00:00Z",
        "seasonalFactor": "late_winter_dormant"
      },
      "weather": {
        "avoidRain": true,
        "temperatureRange": [25, 55],
        "windConditions": "calm"
      },
      "followUp": {
        "checkDate": "2025-03-01T00:00:00Z",
        "nextAction": "Monitor healing of pruning cuts",
        "expectedResults": "Clean cuts should begin callusing within 2-4 weeks"
      },
      "videoUrl": "https://videos.treecare.app/pruning-crossing-branches.mp4",
      "status": "pending"
    },
    {
      "id": "rec_124", 
      "type": "watering",
      "priority": "medium",
      "title": "Deep Winter Watering",
      "description": "Provide supplemental watering during dry winter period",
      "timing": {
        "idealDate": "2025-01-20T00:00:00Z"
      },
      "status": "pending"
    }
  ],
  "summary": {
    "totalRecommendations": 2,
    "urgentCount": 0,
    "highPriorityCount": 1,
    "overdue": 0
  }
}
```

### Mark Recommendation Complete
```http
PUT /recommendations/{recommendationId}/complete
```

**Request Body:**
```json
{
  "completedAt": "2025-01-15T14:30:00Z",
  "notes": "Successfully removed three crossing branches. Clean cuts made.",
  "beforePhotoId": "photo_before_123",
  "afterPhotoId": "photo_after_124", 
  "results": {
    "timeSpent": 50,
    "difficultyExperienced": "intermediate",
    "satisfaction": 4
  }
}
```

### Get Recommendation History
```http
GET /trees/{treeId}/recommendations/history
```

**Response:**
```json
{
  "history": [
    {
      "id": "rec_123",
      "type": "pruning", 
      "title": "Winter Pruning",
      "recommendedDate": "2025-02-15T00:00:00Z",
      "completedAt": "2025-02-18T14:30:00Z",
      "status": "completed",
      "userNotes": "Went well, good results",
      "beforeAfterPhotos": ["photo_456", "photo_457"]
    }
  ]
}
```

## Species Database

### Search Species
```http
GET /species/search
```

**Query Parameters:**
- `q`: Search query (species name, common name)
- `location` (optional): Filter by compatible location
- `limit` (optional): Number of results (default: 20)

**Response:**
```json
{
  "species": [
    {
      "speciesId": "species_456",
      "scientificName": "Quercus rubra",
      "commonNames": ["Red Oak", "Northern Red Oak"],
      "family": "Fagaceae",
      "characteristics": {
        "matureHeight": [50, 75],
        "matureSpread": [50, 65],
        "growthRate": "moderate",
        "hardinesZones": [3, 4, 5, 6, 7, 8],
        "sunRequirements": "full sun to partial shade",
        "soilPreferences": ["well-drained", "acidic", "loamy"]
      },
      "shapeCompatibility": ["high_canopy", "natural_form", "specimen"],
      "imageUrl": "https://cdn.treecare.app/species/quercus_rubra.jpg"
    }
  ]
}
```

### Get Species Details
```http
GET /species/{speciesId}
```

**Response:**
```json
{
  "speciesId": "species_456",
  "scientificName": "Quercus rubra",
  "commonNames": ["Red Oak", "Northern Red Oak"],
  "family": "Fagaceae",
  "characteristics": {
    "matureHeight": [50, 75],
    "matureSpread": [50, 65],
    "growthRate": "moderate",
    "hardinesZones": [3, 4, 5, 6, 7, 8],
    "lifespan": 150,
    "sunRequirements": "full sun to partial shade",
    "soilPreferences": ["well-drained", "acidic", "loamy"],
    "droughtTolerance": "moderate",
    "saltTolerance": "low"
  },
  "pruning": {
    "bestSeason": ["late_winter", "early_spring"],
    "avoidSeason": ["spring", "early_summer"],
    "restrictions": ["oak_wilt_prevention"],
    "techniques": ["central_leader", "scaffold_pruning"],
    "youngTreeSchedule": {
      "year1": ["minimal_pruning", "establish_leader"],
      "year2": ["select_scaffolds", "remove_suckers"],
      "year3-5": ["crown_lifting", "structural_pruning"]
    }
  },
  "diseases": [
    {
      "name": "Oak Wilt",
      "symptoms": ["leaf wilting", "leaf browning", "defoliation"],
      "prevention": "Avoid pruning April-October",
      "treatment": "Immediate removal if infected"
    }
  ],
  "shapeCompatibility": [
    {
      "goalId": "high_canopy", 
      "suitability": "excellent",
      "timeline": "8-12 years",
      "notes": "Natural high-branching habit"
    },
    {
      "goalId": "natural_form",
      "suitability": "excellent", 
      "timeline": "5-8 years"
    }
  ]
}
```

## Notifications

### Schedule Notification
```http
POST /notifications/schedule
```

**Request Body:**
```json
{
  "treeId": "tree_abc123",
  "type": "care_reminder",
  "title": "Time to check your Red Oak",
  "message": "Optimal pruning window opens in 3 days",
  "scheduledTime": "2025-02-12T09:00:00Z",
  "channels": ["push", "sms"],
  "metadata": {
    "recommendationId": "rec_123",
    "priority": "high"
  }
}
```

### Get User Notifications
```http
GET /notifications
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `sent`, `failed`)
- `limit` (optional): Number of notifications (default: 50)

**Response:**
```json
{
  "notifications": [
    {
      "notificationId": "notif_789",
      "treeId": "tree_abc123",
      "type": "care_reminder",
      "title": "Time to check your Red Oak",
      "message": "Optimal pruning window opens in 3 days",
      "scheduledTime": "2025-02-12T09:00:00Z",
      "sentAt": "2025-02-12T09:00:15Z",
      "status": "sent",
      "channels": ["push"],
      "opened": true
    }
  ]
}
```

## Subscriptions & Payments

### Get Subscription Status
```http
GET /subscriptions/status
```

**Response:**
```json
{
  "subscriptionTier": "hobbyist",
  "status": "active",
  "currentPeriodStart": "2024-12-01T00:00:00Z",
  "currentPeriodEnd": "2025-01-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "usage": {
    "treesCount": 7,
    "maxTrees": 10,
    "photosThisMonth": 15,
    "maxPhotos": 100
  },
  "billing": {
    "amount": 499,
    "currency": "usd",
    "interval": "month",
    "nextBillingDate": "2025-02-01T00:00:00Z"
  }
}
```

### Create Subscription
```http
POST /subscriptions
```

**Request Body:**
```json
{
  "priceId": "price_hobbyist_monthly",
  "paymentMethodId": "pm_1234567890"
}
```

### Cancel Subscription
```http
DELETE /subscriptions
```

**Request Body:**
```json
{
  "cancelAtPeriodEnd": true,
  "cancellationReason": "cost"
}
```

## Health & Monitoring

### API Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00Z",
  "version": "1.2.3",
  "services": {
    "database": "healthy",
    "aiModels": "healthy", 
    "storage": "healthy"
  },
  "responseTime": 45
}
```

### Service Status
```http
GET /status
```

**Response:**
```json
{
  "api": {
    "status": "operational",
    "responseTime": 125
  },
  "aiAnalysis": {
    "status": "operational",
    "averageProcessingTime": 3500
  },
  "photoStorage": {
    "status": "operational",
    "uploadSuccess": 99.8
  },
  "notifications": {
    "status": "operational",
    "deliveryRate": 98.5
  }
}
```

## Rate Limits

### Free Tier
- 50 requests per hour
- 10 photo analyses per day
- 5 MB max file upload

### Hobbyist Tier  
- 500 requests per hour
- 100 photo analyses per day
- 10 MB max file upload

### Arborist/Professional Tiers
- 2000 requests per hour
- Unlimited photo analyses
- 25 MB max file upload

### Rate Limit Headers
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1640995200
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid request format |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 413 | Payload Too Large - File size exceeds limit |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |
| 502 | Bad Gateway - AI service unavailable |
| 503 | Service Unavailable - Temporary outage |

This API documentation provides complete coverage of all endpoints needed to build a full-featured tree care mobile application with AI-powered analysis and intelligent recommendations.

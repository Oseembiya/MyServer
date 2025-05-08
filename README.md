# ParentPay Server - School Activities API

Backend server for the ParentPay school activities e-commerce platform built with Express.js and MongoDB.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Deployment**: AWS Elastic Beanstalk
- **Image Storage**: AWS S3 Bucket
- **API Documentation**: Swagger/OpenAPI

## 📋 API Endpoints

### Lessons

- `GET /api/lessons` - Get all available lessons
- `GET /api/lessons/:id` - Get specific lesson details
- `GET /api/lessons/search?q={query}` - Search lessons by subject or location
- `POST /api/lessons` - Add new lesson (admin only)
- `PUT /api/lessons/:id` - Update lesson details (admin only)
- `DELETE /api/lessons/:id` - Remove lesson (admin only)

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Images

- `GET /api/images/:imagePath` - Serve lesson images
- `POST /api/images/upload` - Upload new image (admin only)

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   AWS_ACCESS_KEY=your_aws_access_key
   AWS_SECRET_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=your_s3_bucket_name
   ```

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📦 Project Structure

```
Server/
├── config/             # Configuration files
├── controllers/        # Request handlers
├── middleware/         # Custom middleware
├── models/            # Database models
├── routes/            # API routes
├── services/          # Business logic
├── utils/             # Helper functions
└── Express.js         # Main application file
```

## 🔐 Security Features

- CORS configuration
- Rate limiting
- Request validation
- JWT authentication
- Input sanitization
- Error handling middleware

## 📊 Database Schema

### Lesson Schema

```javascript
{
  title: String,
  description: String,
  price: Number,
  location: String,
  subject: String,
  availableSpaces: Number,
  imageUrl: String,
  rating: Number
}
```

### Order Schema

```javascript
{
  lessons: [LessonSchema],
  customerInfo: {
    name: String,
    email: String,
    address: String
  },
  totalAmount: Number,
  status: String,
  createdAt: Date
}
```

## 🔄 Error Handling

The server implements a centralized error handling system with appropriate HTTP status codes and error messages.

## 📝 Logging

- Request logging using Morgan
- Error logging with Winston
- AWS CloudWatch integration

## 🚀 Deployment

1. **AWS Elastic Beanstalk Setup**

   ```bash
   eb init
   eb create
   eb deploy
   ```

2. **Environment Variables**
   Configure the following in AWS Elastic Beanstalk environment:
   - `NODE_ENV`
   - `MONGODB_URI`
   - `AWS_ACCESS_KEY`
   - `AWS_SECRET_KEY`
   - `AWS_BUCKET_NAME`

## 🔍 Monitoring

- AWS CloudWatch metrics
- Custom health checks
- Performance monitoring
- Error tracking

## 📈 Future Improvements

- Implement GraphQL API
- Add WebSocket support for real-time updates
- Enhance caching strategy
- Implement microservices architecture
- Add automated testing

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📬 Contact

For questions or feedback about the server:

- GitHub: [Oseembiya](https://github.com/Oseembiya)
- Email: [your-email@example.com]

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

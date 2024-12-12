# Voyageur

![Cloud Computing Infrastructure](./cloud-computing-architecture.png)

## 🚀 Capstone Project: Simplifying Group Trip Planning

Voyageur is a mobile application designed to simplify group trip planning through advanced cloud computing solutions. This includes real-time collaboration, secure data management, and robust backend infrastructure.

---

## 🌐 Cloud Computing Architecture

### 🔧 Key Components:
1. **Service Layer**:
   - **Node.js + Express**: Backend APIs for processing requests.
   - **Model Integration**: Machine learning models for personalized recommendations.

2. **Deployment Pipeline**:
   - **Artifact Registry**: Stores containerized applications.
   - **Cloud Build**: Automates the CI/CD process for deployments.
   - **Cloud Run**: Serverless infrastructure for backend services.

3. **Data Storage**:
   - **Firestore**: NoSQL database for real-time data synchronization.
   - **Cloud Storage**: Media and file storage for user uploads.

---

## 🛠 Features Powered by GCP

1. **Real-Time Collaboration**:  
   Firestore enables seamless synchronization across devices.

2. **Automated CI/CD**:  
   Using **Artifact Registry** and **Cloud Build**, every deployment is fast, secure, and efficient.

3. **Secure Data Handling**:  
   Backend APIs deployed on **Cloud Run** ensure scalability and reliability.

4. **Machine Learning**:  
   Integrated models recommend destinations and activities based on user preferences.

---

## 🗂 Folder Structure

```plaintext
root/
├── android/              # Mobile App Source Code
├── cloud-functions/      # Event-driven Cloud Functions
├── backend/              # APIs using Cloud Run
├── cloud-computing-architecture.png  # Cloud Computing Diagram
└── README.md             # Project Documentation

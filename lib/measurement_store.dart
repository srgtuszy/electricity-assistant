import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:electricity_assistant/model/electricity_measurement.dart';

class MeasurementStore {
  static const String collectionName = 'electricity';
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  CollectionReference<Map<String, dynamic>> get electricityCollection =>
      _firestore.collection(collectionName);

  Future<void> addMeasurement(double kwh) async {
    final measurement = ElectricityMeasurement(kwh: kwh, date: DateTime.now());
    await electricityCollection.add(measurement.toFirestore());
  }

  Stream<List<ElectricityMeasurement>> streamMeasurements() {
    return electricityCollection
        .orderBy('date', descending: false)
        .limitToLast(20)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ElectricityMeasurement.fromFirestore(doc.data()))
            .toList());
  }

  Future<void> clearMeasurements() async {
    await electricityCollection.get().then((snapshot) {
      for (var doc in snapshot.docs) {
        doc.reference.delete();
      }
    });
  }
}

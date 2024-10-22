import 'package:cloud_firestore/cloud_firestore.dart';

class ElectricityMeasurement {
  final double kwh;
  final DateTime date;

  ElectricityMeasurement({
    required this.kwh,
    required this.date,
  });

  factory ElectricityMeasurement.fromFirestore(Map<String, dynamic> data) {
    return ElectricityMeasurement(
      kwh: data['kwh'] as double,
      date: (data['date'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'kwh': kwh,
      'date': Timestamp.fromDate(date),
    };
  }
}

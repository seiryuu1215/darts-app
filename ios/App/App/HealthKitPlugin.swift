import Foundation
import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "HealthKitPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readTodayMetrics", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readMetricsForRange", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAuthorized", returnType: CAPPluginReturnPromise),
    ]

    private let healthStore = HKHealthStore()

    // リクエストする HealthKit データ型
    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        if let restingHR = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) { types.insert(restingHR) }
        if let heartRate = HKQuantityType.quantityType(forIdentifier: .heartRate) { types.insert(heartRate) }
        if let hrv = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) { types.insert(hrv) }
        if let steps = HKQuantityType.quantityType(forIdentifier: .stepCount) { types.insert(steps) }
        if let activeEnergy = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) { types.insert(activeEnergy) }
        if let exerciseTime = HKQuantityType.quantityType(forIdentifier: .appleExerciseTime) { types.insert(exerciseTime) }
        if let standTime = HKQuantityType.quantityType(forIdentifier: .appleStandTime) { types.insert(standTime) }
        if let respRate = HKQuantityType.quantityType(forIdentifier: .respiratoryRate) { types.insert(respRate) }
        if let spo2 = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation) { types.insert(spo2) }
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(sleepType) }
        return types
    }

    // ==========================================
    // 権限リクエスト
    // ==========================================
    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit is not available on this device")
            return
        }

        healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            if let error = error {
                call.reject("Authorization failed: \(error.localizedDescription)")
            } else {
                call.resolve(["granted": success])
            }
        }
    }

    // ==========================================
    // 権限状態確認
    // ==========================================
    @objc func isAuthorized(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["authorized": false, "available": false])
            return
        }

        // restingHeartRate の権限状態で代表判定
        if let type = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) {
            let status = healthStore.authorizationStatus(for: type)
            call.resolve([
                "authorized": status == .sharingAuthorized || status == .notDetermined,
                "available": true,
                "status": status.rawValue
            ])
        } else {
            call.resolve(["authorized": false, "available": true])
        }
    }

    // ==========================================
    // 今日のメトリクスを一括取得
    // ==========================================
    @objc func readTodayMetrics(_ call: CAPPluginCall) {
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)

        readMetricsForDay(date: startOfDay, endDate: now) { result in
            call.resolve(result as PluginCallResultData)
        }
    }

    // ==========================================
    // 過去N日間のメトリクスを一括取得
    // ==========================================
    @objc func readMetricsForRange(_ call: CAPPluginCall) {
        let days = min(call.getInt("days") ?? 30, 90) // 最大90日
        let calendar = Calendar.current
        let now = Date()

        var allResults: [[String: Any]] = []
        let rangeGroup = DispatchGroup()

        for dayOffset in 0..<days {
            rangeGroup.enter()

            guard let targetDate = calendar.date(byAdding: .day, value: -dayOffset, to: now) else {
                rangeGroup.leave()
                continue
            }

            let startOfDay = calendar.startOfDay(for: targetDate)
            let endOfDay: Date
            if dayOffset == 0 {
                endOfDay = now
            } else {
                endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? startOfDay
            }

            readMetricsForDay(date: startOfDay, endDate: endOfDay) { result in
                allResults.append(result)
                rangeGroup.leave()
            }
        }

        rangeGroup.notify(queue: .main) {
            // 日付順でソート（新しい順）
            let sorted = allResults.sorted { a, b in
                let dateA = a["metricDate"] as? String ?? ""
                let dateB = b["metricDate"] as? String ?? ""
                return dateA > dateB
            }
            call.resolve(["metrics": sorted])
        }
    }

    // ==========================================
    // 1日分のメトリクスを取得（内部共通メソッド）
    // ==========================================
    private func readMetricsForDay(date startOfDay: Date, endDate: Date, completion: @escaping ([String: Any]) -> Void) {
        let calendar = Calendar.current
        // 睡眠は昨日の夜から今日の朝を含むため、少し広めに取る
        let sleepStart = calendar.date(byAdding: .hour, value: -12, to: startOfDay) ?? startOfDay

        let group = DispatchGroup()

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        var result: [String: Any] = [
            "metricDate": formatter.string(from: startOfDay)
        ]

        // --- 安静時心拍 ---
        group.enter()
        querySample(type: .restingHeartRate, start: startOfDay, end: endDate) { value in
            result["restingHr"] = value as Any
            group.leave()
        }

        // --- 平均心拍 ---
        group.enter()
        queryAverage(type: .heartRate, start: startOfDay, end: endDate) { value in
            result["avgHr"] = value as Any
            group.leave()
        }

        // --- 最大心拍 ---
        group.enter()
        queryMax(type: .heartRate, start: startOfDay, end: endDate) { value in
            result["maxHr"] = value as Any
            group.leave()
        }

        // --- HRV (SDNN) ---
        group.enter()
        querySample(type: .heartRateVariabilitySDNN, start: startOfDay, end: endDate) { value in
            result["hrvSdnn"] = value as Any
            group.leave()
        }

        // --- 歩数 ---
        group.enter()
        queryCumulative(type: .stepCount, start: startOfDay, end: endDate) { value in
            result["steps"] = value.map { Int($0) } as Any
            group.leave()
        }

        // --- アクティブエネルギー ---
        group.enter()
        queryCumulative(type: .activeEnergyBurned, start: startOfDay, end: endDate) { value in
            result["activeEnergyKcal"] = value as Any
            group.leave()
        }

        // --- エクササイズ分 ---
        group.enter()
        queryCumulative(type: .appleExerciseTime, start: startOfDay, end: endDate) { value in
            result["exerciseMinutes"] = value.map { Int($0) } as Any
            group.leave()
        }

        // --- 呼吸数 ---
        group.enter()
        querySample(type: .respiratoryRate, start: startOfDay, end: endDate) { value in
            result["respiratoryRate"] = value as Any
            group.leave()
        }

        // --- SpO2 ---
        group.enter()
        querySample(type: .oxygenSaturation, start: startOfDay, end: endDate) { value in
            result["bloodOxygenPct"] = value.map { $0 * 100 } as Any // 0-1 → 0-100
            group.leave()
        }

        // --- 睡眠 ---
        group.enter()
        querySleep(start: sleepStart, end: endDate) { sleepData in
            result.merge(sleepData) { _, new in new }
            group.leave()
        }

        group.notify(queue: .global(qos: .userInitiated)) {
            completion(result)
        }
    }

    // ==========================================
    // クエリヘルパー
    // ==========================================

    private func querySample(type identifier: HKQuantityTypeIdentifier, start: Date, end: Date, completion: @escaping (Double?) -> Void) {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else {
            completion(nil)
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil)
                return
            }
            let unit = self.preferredUnit(for: identifier)
            completion(round(sample.quantity.doubleValue(for: unit) * 10) / 10)
        }
        healthStore.execute(query)
    }

    private func queryAverage(type identifier: HKQuantityTypeIdentifier, start: Date, end: Date, completion: @escaping (Double?) -> Void) {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else {
            completion(nil)
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .discreteAverage) { _, stats, _ in
            let unit = self.preferredUnit(for: identifier)
            let value = stats?.averageQuantity()?.doubleValue(for: unit)
            completion(value.map { round($0 * 10) / 10 })
        }
        healthStore.execute(query)
    }

    private func queryMax(type identifier: HKQuantityTypeIdentifier, start: Date, end: Date, completion: @escaping (Double?) -> Void) {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else {
            completion(nil)
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .discreteMax) { _, stats, _ in
            let unit = self.preferredUnit(for: identifier)
            let value = stats?.maximumQuantity()?.doubleValue(for: unit)
            completion(value.map { round($0 * 10) / 10 })
        }
        healthStore.execute(query)
    }

    private func queryCumulative(type identifier: HKQuantityTypeIdentifier, start: Date, end: Date, completion: @escaping (Double?) -> Void) {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else {
            completion(nil)
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
            let unit = self.preferredUnit(for: identifier)
            let value = stats?.sumQuantity()?.doubleValue(for: unit)
            completion(value.map { round($0 * 10) / 10 })
        }
        healthStore.execute(query)
    }

    private func querySleep(start: Date, end: Date, completion: @escaping ([String: Any]) -> Void) {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            completion([:])
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
            var totalMinutes: Double = 0
            var deepMinutes: Double = 0
            var remMinutes: Double = 0
            var coreMinutes: Double = 0
            var awakeMinutes: Double = 0
            var inBedMinutes: Double = 0

            guard let categorySamples = samples as? [HKCategorySample] else {
                completion([:])
                return
            }

            for sample in categorySamples {
                let minutes = sample.endDate.timeIntervalSince(sample.startDate) / 60

                if sample.value == HKCategoryValueSleepAnalysis.inBed.rawValue {
                    inBedMinutes += minutes
                } else if sample.value == HKCategoryValueSleepAnalysis.awake.rawValue {
                    awakeMinutes += minutes
                } else if #available(iOS 16.0, *) {
                    switch sample.value {
                    case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                        totalMinutes += minutes
                    case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                        coreMinutes += minutes
                        totalMinutes += minutes
                    case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                        deepMinutes += minutes
                        totalMinutes += minutes
                    case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                        remMinutes += minutes
                        totalMinutes += minutes
                    default:
                        break
                    }
                } else {
                    // iOS 15: asleep (generic)
                    if sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue {
                        totalMinutes += minutes
                    }
                }
            }

            var result: [String: Any] = [:]
            if totalMinutes > 0 { result["sleepDurationMinutes"] = Int(totalMinutes) }
            if deepMinutes > 0 { result["sleepDeepMinutes"] = Int(deepMinutes) }
            if remMinutes > 0 { result["sleepRemMinutes"] = Int(remMinutes) }
            if coreMinutes > 0 { result["sleepCoreMinutes"] = Int(coreMinutes) }
            if awakeMinutes > 0 { result["sleepAwakeMinutes"] = Int(awakeMinutes) }
            if inBedMinutes > 0 { result["timeInBedMinutes"] = Int(inBedMinutes) }

            completion(result)
        }
        healthStore.execute(query)
    }

    private func preferredUnit(for identifier: HKQuantityTypeIdentifier) -> HKUnit {
        switch identifier {
        case .heartRate, .restingHeartRate:
            return HKUnit.count().unitDivided(by: .minute())
        case .heartRateVariabilitySDNN:
            return .secondUnit(with: .milli)
        case .stepCount:
            return .count()
        case .activeEnergyBurned:
            return .kilocalorie()
        case .appleExerciseTime:
            return .minute()
        case .respiratoryRate:
            return HKUnit.count().unitDivided(by: .minute())
        case .oxygenSaturation:
            return .percent()
        default:
            return .count()
        }
    }
}

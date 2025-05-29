import {View, ScrollView} from 'react-native';
import React, {FC} from 'react';
import {commonStyles} from '../styles/CommonStyles';
import HomeHeader from '../components/home/HomeHeader';
import SendReceiveButton from '../components/home/SendReceiveButton';
import Misc from '../components/home/Misc';
import ReceivedFileScreen from './ReceivedFileScreen';

const HomeScreen: FC = () => {
  return (
    <View style={commonStyles.baseContainer}>
      <HomeHeader />

      <ScrollView
        contentContainerStyle={{paddingHorizontal: 5}}
        showsVerticalScrollIndicator={false}>
        <SendReceiveButton />
        <Misc />
        <ReceivedFileScreen />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;


